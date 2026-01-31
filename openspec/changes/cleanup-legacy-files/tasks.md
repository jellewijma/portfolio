## 1. Verification

- [x] 1.1 Verify no references to car.html using `grep -r "car\\.html" .`
- [x] 1.2 Verify no references to anthias directory using `grep -r "anthias" .`
- [x] 1.3 Confirm car.html exists and is empty (1 line)
- [x] 1.4 Confirm anthias directory contains expected files (index.html, video files)

## 2. File Removal

- [x] 2.1 Delete car.html file
- [x] 2.2 Delete anthias directory and all contents (recursive)
- [x] 2.3 Verify car.html no longer exists in repository
- [x] 2.4 Verify anthias directory no longer exists in repository

## 3. Documentation Update

- [x] 3.1 Edit AGENTS.md line 86: remove "car.html" from list of HTML files
- [x] 3.2 Edit AGENTS.md line 89: remove anthias directory documentation
- [x] 3.3 Verify AGENTS.md formatting remains consistent (4-space indentation)
- [x] 3.4 Review AGENTS.md for any other references to removed files

## 4. Testing

- [x] 4.1 Start local server with `python3 -m http.server 8000`
- [x] 4.2 Test index.html loads correctly with all styling
- [x] 4.3 Test gallery.html loads correctly with all styling
- [x] 4.4 Verify mobile menu toggle works on both pages
- [x] 4.5 Confirm modal dismissal works on index.html
- [x] 4.6 Check hover effects on photography category cards

## 5. Git Operations

- [ ] 5.1 Stage all changes (`git add -A`)
- [ ] 5.2 Commit with message "cleanup: remove legacy files (car.html, anthias/)"
- [ ] 5.3 Verify commit includes file deletions and AGENTS.md updates
- [ ] 5.4 Push to main branch for GitHub Pages deployment
- [ ] 5.5 Confirm live site functions after deployment