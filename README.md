## AWS ECR, ECS 배포 자동화

### 진행순서

1. WAS 생성
   - fastify 설치
     ```bash
     fastify generate . --lang=typescript
     npm i
     npm run dev
     ```
2. WAS Docker Image 생성
   - Dockerfile 작성
     ```text
     FROM node:6.0
     COPY . .
     RUN npm i
     RUN npm run build
     CMD ["npm", "run", "start"]
     ```
   - .dockerignore 작성
3. WAS Docker Image 빌드 및 실행
   ```bash
   docker build -t sample-aws-was:1.0 ./sample-aws-was
   docker run -itd --name sample-aws-was -p 3000:3000 sample-aws-was:1.0
   ```
4. DB Docker Image 생성
   - Dockerfile 작성
     ```text
     FROM mongo:6.0
     COPY ./init-mongo.js ./docker-entrypoint-initdb.d/
     ENV MONGO_INITDB_ROOT_USERNAME=root \
         MONGO_INITDB_ROOT_PASSWORD=1q2w3e
     ```
5. WAS, DB Container 실행 후 연결

   - docker-compose.yaml 작성

     ```yaml

     ```

6. AWS ECR 레파지토리 생성 후 이미지 푸시
7. Github Actions를 이용한 이미지 푸시 자동화
8. ECR 이미지를 이용한 ECS 컨테이너 세팅
9. Github Actions를 이용한 배포 자동화
   - Code Commit, Code Build도 사용해보기
