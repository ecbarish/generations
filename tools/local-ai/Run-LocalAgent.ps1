param([ValidateSet('Ask','Queue','Status','StopModel')][string]$Mode='Ask',[switch]$ReadOnly,[string]$LocalRoot=(Join-Path $env:USERPROFILE 'Local-AI'))
$ErrorActionPreference='Stop'
$taskRoot=[IO.Path]::GetFullPath($LocalRoot)
. (Join-Path $PSScriptRoot 'Results.ps1')
$taskTools=Get-Content -LiteralPath (Join-Path $taskRoot 'tools.json') -Raw | ConvertFrom-Json
$taskRepo=Join-Path $taskRoot 'idle-arcade'
$taskLogs=Join-Path $taskRoot 'logs'
$env:OLLAMA_NO_CLOUD='1'

$env:OLLAMA_NUM_PARALLEL='1'
$env:PATH=(Split-Path $taskTools.node)+';'+(Split-Path $taskTools.ollama)+';'+$env:PATH
if($Mode -eq 'StopModel'){& $taskTools.ollama stop $taskTools.model;Write-Host 'Model unloaded; GPU memory released.';exit $LASTEXITCODE}
function Start-LocalRunner {
 try{Invoke-RestMethod 'http://127.0.0.1:11434/api/version' -TimeoutSec 3 | Out-Null;return}catch{}
 Start-Process -FilePath $taskTools.ollama -ArgumentList 'serve' -WindowStyle Hidden -RedirectStandardOutput (Join-Path $taskLogs 'server.out.log') -RedirectStandardError (Join-Path $taskLogs 'server.err.log') | Out-Null
 for($i=0;$i -lt 30;$i++){Start-Sleep -Seconds 1;try{Invoke-RestMethod 'http://127.0.0.1:11434/api/version' -TimeoutSec 2 | Out-Null;return}catch{}}
 throw 'Ollama did not start. Read logs/server.err.log.'
}
Start-LocalRunner
if($Mode -eq 'Status'){& $taskTools.ollama list;& $taskTools.ollama ps;Write-Host "Workspace: $taskRepo";exit}
$taskModelNames=(Invoke-RestMethod 'http://127.0.0.1:11434/api/tags').models.name
if($taskTools.model -notin $taskModelNames){throw 'The model selected in tools.json is missing. Finish its setup first.'}
$taskQueue=@()
if($Mode -eq 'Queue'){
 $taskQueue=@(Get-ChildItem -LiteralPath (Join-Path $taskRoot 'queue') -Filter '*.json' | Sort-Object Name)
 if(-not $taskQueue.Count){Write-Host 'The queue is empty. Copy an example into queue/ and edit its prompt.';exit}
}else{
 Write-Host 'Local AI coding helper - runs on your GPU, without cloud inference.'
 Write-Host 'Edits stay in the separate clone for review; pushing is disabled.'
 $taskPrompt=Read-Host 'What should it work on?'
 if([string]::IsNullOrWhiteSpace($taskPrompt)){exit}
 $taskQueue=@([pscustomobject]@{Inline=$true;Prompt=$taskPrompt;Readonly=[bool]$ReadOnly})
}
$taskLock=Join-Path $taskRoot 'helper.lock'
try{$taskLockStream=[IO.File]::Open($taskLock,[IO.FileMode]::OpenOrCreate,[IO.FileAccess]::ReadWrite,[IO.FileShare]::None)}catch{throw 'Another helper run is active. Wait for it to finish.'}
try{
 foreach($taskItem in $taskQueue){
  $taskDirty=@(& git -C $taskRepo status --porcelain)
  if($LASTEXITCODE -ne 0){throw 'Cannot inspect helper clone; stopping without changes.'}
  if($taskDirty.Count){Write-Host 'Stopped: the clone has changes waiting for review. Nothing was reset.';break}
  if($Mode -eq 'Queue'){$taskSpec=Get-Content -LiteralPath $taskItem.FullName -Raw | ConvertFrom-Json;$taskPrompt=$taskSpec.prompt;$taskIsReadOnly=$taskSpec.mode -ne 'edit'}else{$taskPrompt=$taskItem.Prompt;$taskIsReadOnly=$taskItem.Readonly}
  if([string]::IsNullOrWhiteSpace($taskPrompt)){throw 'A task needs a prompt.'}
  if($Mode -eq 'Queue' -and $taskSpec.mode -notin @('read-only','edit')){throw 'Queue mode must be read-only or edit.'}
  $taskStamp=Get-Date -Format 'yyyyMMdd-HHmmss-fff'
  $taskResult=Join-Path $taskLogs ($taskStamp+'.result.md')
  $taskEventLog=Join-Path $taskLogs ($taskStamp+'.events.jsonl')
  $taskErrorLog=Join-Path $taskLogs ($taskStamp+'.stderr.log')
  $taskPromptLog=Join-Path $taskLogs ($taskStamp+'.prompt.txt')
  $taskBoundary=@"
This is Evan's separate LOCAL HELPER workspace, not Claude's workspace. Do ONLY the task below. The task overrides repo autopilot: do not take Lane A/B/C tasks, claim projects, edit queue/status documents or start additional projects. Read the attached primer.md and lessons.md first. Use project documents only when the task needs them; avoid loading huge unrelated files. Never use C:/Users/evanb/OneDrive/Desktop/idle-arcade. Never push, merge, change remotes, touch credentials, install packages, or use paid/cloud services. Do not edit starfall-godot/ or play/; those belong to Claude. Do not create commits; leave a diff for review. If discussing commits, only 206636510+ecbarish@users.noreply.github.com is allowed. Keep scope small and use the provided Node runtime when needed. Shell commands are disabled in this starter helper; use read, glob, grep and (for edit tasks) edit/patch tools. Static inspection is available, but executable tests are not. State that limitation honestly. Do not claim browser tests passed unless you actually ran them. End with a concise report of findings or changes, checks, and remaining questions. Stop after this one task.
"@
  if($taskIsReadOnly){$taskBoundary+="`nThis task is READ ONLY. Do not edit repository files. Shell commands are disabled; use read, glob and grep tools."}
  $taskFullPrompt=$taskBoundary+"`n`nTASK:`n"+$taskPrompt
  Set-Content -LiteralPath $taskPromptLog -Value $taskFullPrompt -Encoding UTF8
  $taskAccess=if($taskIsReadOnly){'read-only'}else{'workspace-write'}
  $taskPsi=[Diagnostics.ProcessStartInfo]::new()
  $taskPsi.FileName=$taskTools.opencode
  $taskPsi.WorkingDirectory=$taskRepo
  $taskPsi.UseShellExecute=$false;$taskPsi.CreateNoWindow=$true
  $taskPsi.RedirectStandardInput=$true;$taskPsi.RedirectStandardOutput=$true;$taskPsi.RedirectStandardError=$true
  $taskPsi.Environment['OPENCODE_CONFIG']=Join-Path $taskRoot 'opencode-local.json'
  $taskPermission=Get-LocalAgentPermission -ReadOnly:$taskIsReadOnly
  $taskShow=Invoke-RestMethod 'http://127.0.0.1:11434/api/show' -Method Post -ContentType 'application/json' -Body (@{model=$taskTools.model}|ConvertTo-Json -Compress)
  $taskContext=16384
  if($taskShow.parameters -match '(?m)^num_ctx\s+(\d+)'){$taskContext=[int]$Matches[1]}
  if($taskTools.contextLength){$taskContext=[int]$taskTools.contextLength}
  $taskModelConfig=@{name=$taskTools.model;tool_call=$true;limit=@{context=$taskContext;output=4096}}
  $taskOverrides=@{permission=$taskPermission;model=('ollama/'+$taskTools.model);small_model=('ollama/'+$taskTools.model);provider=@{ollama=@{models=@{$taskTools.model=$taskModelConfig}}}}
  $taskPsi.Environment['OPENCODE_CONFIG_CONTENT']=($taskOverrides|ConvertTo-Json -Compress -Depth 8)
  $taskAttachments=@('primer.md','lessons.md') | ForEach-Object {Join-Path $taskRoot $_}
  foreach($taskAttachment in $taskAttachments){if(-not (Test-Path -LiteralPath $taskAttachment -PathType Leaf)){throw "Missing helper context: $taskAttachment"}}
  foreach($taskArg in @('run','--pure','--dir',$taskRepo,'-m',('ollama/'+$taskTools.model),'--format','json','-f')+$taskAttachments+@('--',$taskFullPrompt)){$taskPsi.ArgumentList.Add($taskArg)}
  $taskProcess=[Diagnostics.Process]::new();$taskProcess.StartInfo=$taskPsi;$taskStarted=$false;$taskOut=$null;$taskErr=$null
  Write-Host "Working locally ($taskAccess). Results: $taskResult"
  $taskTimer=[Diagnostics.Stopwatch]::StartNew()
  try{
   $taskStarted=$taskProcess.Start()
   $taskOut=$taskProcess.StandardOutput.ReadToEndAsync();$taskErr=$taskProcess.StandardError.ReadToEndAsync()
   $taskProcess.StandardInput.Close()
   while(-not $taskProcess.WaitForExit(15000)){
    Write-Host ('Still working on your GPU: '+[int]$taskTimer.Elapsed.TotalSeconds+' seconds')
    if($taskTimer.Elapsed.TotalMinutes -ge 12){$taskProcess.Kill($true);throw 'Task hit the 12-minute limit. Inspect the logs before retrying.'}
   }
   [IO.File]::WriteAllText($taskEventLog,$taskOut.GetAwaiter().GetResult());[IO.File]::WriteAllText($taskErrorLog,$taskErr.GetAwaiter().GetResult())
   if($taskProcess.ExitCode -ne 0){throw "Agent exited with code $($taskProcess.ExitCode). Read $taskErrorLog"}
   $taskEvents=@($taskOut.GetAwaiter().GetResult() -split '\r?\n' | Where-Object {$_} | ForEach-Object {$_ | ConvertFrom-Json})
   $taskReport=Get-LocalAgentReport -Events $taskEvents
   Set-Content -LiteralPath $taskResult -Value $taskReport -Encoding UTF8
   Get-Content -LiteralPath $taskResult
   if($Mode -eq 'Queue'){Move-Item -LiteralPath $taskItem.FullName -Destination (Join-Path $taskRoot ('completed/'+$taskStamp+'-'+$taskItem.Name))}
   Write-Host 'Run finished. A completed queue entry means ran for review, not shipped or approved.'
  }finally{if($taskStarted -and -not $taskProcess.HasExited){$taskProcess.Kill($true);$taskProcess.WaitForExit()};if($taskOut){[IO.File]::WriteAllText($taskEventLog,$taskOut.GetAwaiter().GetResult())};if($taskErr){[IO.File]::WriteAllText($taskErrorLog,$taskErr.GetAwaiter().GetResult())};$taskProcess.Dispose()}
  $taskAfter=@(& git -C $taskRepo status --porcelain);if($LASTEXITCODE -ne 0){throw 'Cannot inspect clone after task; stopping.'};if($taskAfter.Count){Write-Host 'Changes are waiting for review. Stopping the queue here.';break}
 }
}finally{$taskLockStream.Dispose()}
