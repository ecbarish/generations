# WB-PREVIEW-177 release claim

Claimed by Adam / abarish-dev, 2026-10-11, before build.

Adam explicitly approved marking #177 ready, merging it, and rebuilding/publishing the web preview so its entrance and D-pad fixes go live.

Scope: after #177 merges, export one pack from its merged Wildbond source using official Godot 4.7.2. Preserve the existing engine files. Commit the exact exported pack, shell byte count, build metadata and release bookkeeping through this separate PR. Review the committed pack in the browser, including old-save compatibility and door/phone-control behavior. Merge only after green checks and the PROCESS self-check, then verify deployment and live file hashes. No unrelated #176 merge or game features.

Current preview pins source 0bc8e7b from 2026-10-10; rebuilding current source also includes already merged Wildbond homes, roof routing and story/control work. Exact merged source and validation results will be recorded before publication.
