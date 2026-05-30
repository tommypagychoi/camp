# Camp Rental Guide

캠핑 렌탈 품목과 이용 가이드를 소개하는 정적 웹페이지입니다. GitHub Pages에서 바로 배포할 수 있도록 `index.html`, `styles.css`, `assets/camp-hero.jpg`만으로 구성했습니다.

## 구성

- `index.html`: 캠핑 렌탈 소개, 품목, 이용 단계, 출발 전 체크리스트, GitHub 저장소 링크
- `styles.css`: 반응형 레이아웃과 전체 디자인
- `assets/camp-hero.jpg`: 캠핑 렌탈 웹페이지용 히어로 이미지

## 로컬에서 확인

브라우저에서 `index.html` 파일을 열면 바로 확인할 수 있습니다. 별도 빌드 과정은 없습니다.

## GitHub Pages 배포

1. GitHub 저장소의 `Settings`로 이동합니다.
2. `Pages` 메뉴에서 배포 소스를 `Deploy from a branch`로 선택합니다.
3. 브랜치는 `main`, 폴더는 `/root`를 선택합니다.
4. 저장 후 잠시 기다리면 GitHub Pages URL이 생성됩니다.

## 수정 팁

- 렌탈 품목은 `index.html`의 `rental-card` 영역에서 추가하거나 변경할 수 있습니다.
- 색상은 `styles.css` 상단의 `:root` 변수에서 조정할 수 있습니다.
- 이미지 교체 시 같은 파일명인 `assets/camp-hero.jpg`로 덮어두면 HTML 수정 없이 반영됩니다.
