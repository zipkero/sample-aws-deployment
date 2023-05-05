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

   - 컨테이너 시작 시 적용 할 초기화 스크립트 작성 (init-mongo.js)

     ```javascript
     db.createUser({
       user: "root",
       pwd: "1q2w3e",
       roles: [
         {
           role: "readWrite",
           db: "example",
         },
       ],
     });
     ```

     - mongodb

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
     version: "1.1"

     services:
     mongo:
       image: sample-aws-db
       build: ./sample-aws-db
       volumes:
         - ./sample-aws-db/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js
     was:
       image: sample-aws-was
       build: ./sample-aws-was
       ports:
         - "3000:3000"
       environment:
         MONGO_USER: root
         MONGO_PASSWORD: 1q2w3e
         MONGO_DATABASE: example
         MONGO_HOST: mongo
         MONGO_PORT: 27017
     ```

   - was 파일 수정하여 mongodb 연결

     1. mongodb 패키지 설치

        ```bash
        npm i @fastify/mongodb
        ```

     2. app.ts 수정

        ```typescript
        import { fastifyMongodb } from "@fastify/mongodb";

        const {
          MONGO_USER,
          MONGO_PASSWORD,
          MONGO_DATABASE,
          MONGO_HOST,
          MONGO_PORT,
        } = process.env;

        export type AppOptions = {
          // Place your custom options for app below here.
          mongoUrl: string;
        } & Partial<AutoloadPluginOptions>;

        // Pass --options via CLI arguments in command to enable these options.
        const options: AppOptions = {
          mongoUrl: `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`,
        };

        const app: FastifyPluginAsync<AppOptions> = async (
          fastify,
          opts
        ): Promise<void> => {
          // Place here your custom code!
          if (opts.mongoUrl) {
            void fastify.register(fastifyMongodb, {
              url: opts.mongoUrl,
            });
          }
          // .....
        };
        ```

6. AWS ECR 레파지토리 생성 후 이미지 푸시

   - AWS ECR 레파지토리 생성
   - AWS CLI Credentials 등록

     ```
     aws configure
     ```

     - Access Key와 Secret Access Key를 차례대로 등록

   - AWS CLI 인증 토큰을 기반으로 도커 로그인

     ```
     aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin <account_id>.dkr.ecr.ap-northeast-2.amazonaws.com
     ```

   - 도커 이미지 빌드

     ```
     docker build -t sample-aws-was:1.0 ./sample-aws-was
     ```

   - 빌드된 이미지 태그

     ```
     docker tag sample-aws-was:1.0 <account_id>.dkr.ecr.ap-northeast-2.amazonaws.com/sample-aws-was:1.0
     ```

   - 이미지 푸시

     ```
     docker push <account_id>.dkr.ecr.ap-northeast-2.amazonaws.com/sample-aws-was:1.0
     ```

7. Github Actions를 이용한 이미지 푸시 자동화

   - github workflow 작성 > .github/workflows/was-push.yaml

     ```yaml
     name: Deploy to ECR

     on:
       push:
         branches: ["main"]

     env:
       AWS_REGION: ap-northeast-2
       ECR_REPOSITORY: sample-aws-was
       ECS_SERVICE:
       ECS_CLUSTER:
       ECS_TASK_DEFINITION:
       IMAGE_TAG: 1.0

     permissions:
       contents: read

     jobs:
       deploy:
         name: Deploy
         runs-on: ubuntu-latest

         steps:
           - name: Checkout
             uses: actions/checkout@v3

           - name: setup nodejs 20.x
             uses: actions/setup-node@v3
             with:
               node-version: "20.x"

           - name: Configure AWS credentials
             uses: aws-actions/configure-aws-credentials@v1
             with:
               aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
               aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
               aws-region: ${{ env.AWS_REGION }}

           - name: Login to Amazon ECR
             id: login-ecr
             uses: aws-actions/amazon-ecr-login@v1

           - name: Build, tag, and push image to Amazon ECR
             id: build-image
             working-directory: ./sample-aws-was
             env:
               ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
               IMAGE_TAG: ${{ env.IMAGE_TAG }}
             run: |
               # Build a docker container and
               # push it to ECR so that it can
               # be deployed to ECS.
               docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
               docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
               echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT
     ```

8. ECR 이미지를 이용한 ECS 컨테이너 세팅
9. Github Actions를 이용한 배포 자동화
   - Code Commit, Code Build도 사용해보기
