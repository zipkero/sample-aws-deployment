## AWS ECR, ECS 배포 자동화

### 진행순서

1. WAS 생성
   - fastify 설치
     ```bash
     fastify generate . --lang=typescript
     npm i
     npm run dev
     ```
   - node / fastify
2. WAS Docker Image 생성
3. DB Docker Image 생성
   - mongo
4. WAS, DB Container 실행 후 연결
5. AWS ECR 레파지토리 생성 후 이미지 푸시
6. Github Actions를 이용한 이미지 푸시 자동화
7. ECR 이미지를 이용한 ECS 컨테이너 세팅
8. Github Actions를 이용한 배포 자동화
   - Code Commit, Code Build도 사용해보기
