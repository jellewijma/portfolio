## Context

The portfolio repository contains legacy files that are no longer used: an empty `car.html` file and an `anthias/` directory with video files (~38MB) and a test page. These files are not referenced by any active pages and serve no purpose in the current portfolio site. The `AGENTS.md` documentation still references these files, creating inconsistency between documentation and actual repository structure.

## Goals / Non-Goals

**Goals:**
- Remove unused files to reduce repository size by ~38MB
- Simplify project structure by eliminating dead code
- Update documentation to reflect current file structure
- Maintain clean git history with descriptive commit

**Non-Goals:**
- Modifying functional portfolio pages (index.html, gallery.html)
- Changing deployment process or GitHub Pages configuration
- Adding new features or content
- Altering existing image resources or styling

## Decisions

1. **Removal Strategy**: Direct deletion of files without backup in repository.
   - **Rationale**: Files are unused and not referenced; no need to preserve in version history.
   - **Alternative considered**: Move to archive branch – rejected as files have no historical value.

2. **Documentation Update**: Update `AGENTS.md` to remove references to `car.html` and `anthias/` directory.
   - **Rationale**: Keep documentation accurate and useful for future contributors.
   - **Alternative considered**: Leave documentation unchanged – rejected as it would mislead.

3. **Git Approach**: Single commit with clear message describing removed files.
   - **Rationale**: Clean atomic change that can be easily reviewed or reverted.
   - **Alternative considered**: Multiple commits per file type – rejected for simplicity.

4. **Verification Method**: Use `grep` to confirm no references to removed files.
   - **Rationale**: Ensure removal doesn't break any dependencies.
   - **Alternative considered**: Manual inspection – rejected as grep provides comprehensive check.

## Risks / Trade-offs

**Risks:**
- [Accidental removal of referenced file] → Mitigation: Verify with `grep` before deletion.
- [Documentation becomes outdated] → Mitigation: Update AGENTS.md concurrently.
- [Git history confusion] → Mitigation: Clear commit message explaining cleanup.

**Trade-offs:**
- Simplicity vs. safety: Direct deletion is simple but irreversible; could archive instead.
- Comprehensive vs. incremental: Removing all at once vs. piecemeal; choose atomic change.

## Migration Plan

1. **Pre-verification**: Run `grep -r "car\.html\|anthias" .` to confirm no references.
2. **File removal**: Delete `car.html` and `anthias/` directory (including subfiles).
3. **Documentation update**: Edit `AGENTS.md` lines 86 and 89 to remove mentions.
4. **Commit**: `git add -A && git commit -m "cleanup: remove legacy files (car.html, anthias/)"`
5. **Verification**: Check site still works locally with `python3 -m http.server`.
6. **Deployment**: Push to main for GitHub Pages deployment (no functional impact).

## Open Questions

- Should `anthias` video files be preserved elsewhere if they have future value?
- Is `car.html` intended as placeholder for future automotive photography section?