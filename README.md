# 네이버 SEO 키워드 관리

아이템스카우트 엑셀 데이터를 기반으로 키워드를 분석하고 상품명 생성 프롬프트를 만들어주는 도구입니다.

## 배포 방법 (Vercel)

### 1. 로컬 테스트
```bash
npm install
npm run dev
```

### 2. GitHub에 올리기
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/본인아이디/seo-keyword.git
git push -u origin main
```

### 3. Vercel 배포
1. https://vercel.com 접속 → GitHub 로그인
2. "Add New Project" 클릭
3. 방금 만든 GitHub 레포 선택
4. 설정 그대로 두고 "Deploy" 클릭
5. 완료! `xxx.vercel.app` 주소로 접속 가능
