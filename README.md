# lambda.edge
S3에 저장된 이미지를 원하는 크기에 맞게 리사이징하는 프로그램   

## 1. 기술 스택
- AWS S3
- AWS CloudFront
- AWS Lambda
- node.js 14.x
- AWS Route53

## 2. 아키텍처
![img](https://classu.notion.site/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F3f07d679-d5a8-438a-9936-7e075a88f3e6%2FUntitled.png?id=7608e5cf-9d00-4264-86e2-6d2522eff323&table=block&spaceId=1f04f71d-63a9-49f9-bde1-1d1ff960d8e1&width=2000&userId=&cache=v2)


## 3. 프로젝트 구조
[폴더] `backend.python`  
ㄴ [폴더] `node_modules`  
ㄴ [파일] `index.js`(엔트리 포인트)  
ㄴ [파일] `package-lock.json`  
ㄴ [파일] `package.json`  
ㄴ [파일] `README.md`  



## 4. 동작 방식
1. 클라이언트가 썸네일을 요청한다
2. 썸네일이 CloudFront에 캐싱되었다면, 캐싱된 이미지로 응답 
3. 썸네일이 CloudFront에 캐싱되지 않았다면, S3로 이미지를 요청  
    3.1 S3에 이미지가 존재한다면, Lambda@Edge로 배포한 Lambda함수에서 S3로 부터 이미지를 받아 리사징작업을 수행  
    3.2 리사이징된 이미지를 CloudFront에 전달하여 저장(default:24h)하고 최종적으로 클라이언트에게 썸네일을 제공    



## 5. 실행 방법
- npm install
- zip -r [결과물.zip] *
- zip파일을 lambda에 업로드

