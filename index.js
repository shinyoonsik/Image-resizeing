"use strict";

const querystring = require("querystring"); // Don't install.
const AWS = require("aws-sdk");
const Sharp = require("sharp");

const S3 = new AWS.S3({
	signatureVersion: "v4",
	region: "ap-northeast-2" // 버킷을 생성한 리전 입력(여기선 서울)
});

const BUCKET = "resizing-image-leo"; // Input your bucket

const supportImageTypes = [
	"jpg",
	"jpeg",
	"png",
	"gif",
	"webp",
	"svg",
	"tiff",
	"jfif"
];

exports.handler = async (event, context, callback) => {
	const { request, response } = event.Records[0].cf;

	console.log("request: ", request);
	console.log("response: ", response);

	// Parameters are w, h, f, q and indicate width, height, format and quality.
	const { uri } = request;

	const ObjectKey = decodeURIComponent(uri).substring(1);
	const params = querystring.parse(request.querystring);
	const { w, h, q, f } = params;

	/**
	 * ex) https://dilgv5hokpawv.cloudfront.net/dev/thumbnail.png?w=200&h=150&f=webp&q=90
	 * - ObjectKey: 'dev/thumbnail.png'
	 * - w: '200'
	 * - h: '150'
	 * - f: 'webp'
	 * - q: '90'
	 */

	// 크기 조절이 없는 경우 원본 반환.
	if (!(w || h)) {
		return callback(null, response);
	}
	
	const extension = uri.match(/\/?(.*)\.(.*)/)[2].toLowerCase();
	console.log("extension : ", extension);

	const width = parseInt(w, 10) || null;
	const height = parseInt(h, 10) || null;
	const quality = parseInt(q, 10) || 100; // Sharp는 이미지 포맷에 따라서 품질(quality)의 기본값이 다릅니다.
	let format = (f || extension).toLowerCase();
	let s3Object;
	let resizedImage;

	// 포맷 변환이 없는 GIF 포맷 요청은 원본 반환.
	if (extension === "gif" && !f) {
		return callback(null, response);
	}

	// Init format.
	format = format === "jpg" ? "jpeg" : format;

	if (!supportImageTypes.some((type) => type === extension)) {
		throw new Error("Unsupported image type.");
	}

	// Verify For AWS CloudWatch.
	console.log(`parmas: ${JSON.stringify(params)}`); // Cannot convert object to primitive value.\
	console.log("S3 Object key:", ObjectKey);
	console.log("Bucket name : ", BUCKET);

	try {
		s3Object = await S3.getObject({
			Bucket: BUCKET,
			Key: ObjectKey
		}).promise();

		console.log("S3 Object:", s3Object);
	} catch (error) {
		console.log("S3.getObject error : ", error);
		throw new Error("Fail to get S3 object.");
	}

	try {
		resizedImage = await Sharp(s3Object.Body)
			.rotate()
			.resize(width, height)
			.toFormat(format, {
				quality
			})
			.toBuffer();
	} catch (error) {
		console.log("Sharp error : ", error);
		throw new Error("Fail to resize image.");
	}

	// 응답 이미지 용량이 1MB 이상일 경우 원본 반환.
	if (Buffer.byteLength(resizedImage, "base64") >= 1048576) {
		const callbackFn = {
			status: "200",
			statusDescription: "OK",
			headers: {
				"content-type": [{ key: "Content-Type", value: `image/${format}` }]
			},
			body: s3Object.Body.toString("base64"),
			bodyEncoding: "base64"
		};
		return callback(null, callbackFn);
	}

	console.log("Success resizing image");

	const callbackFn = {
		status: "200",
		statusDescription: "OK",
		headers: {
			"content-type": [{ key: "Content-Type", value: `image/${format}` }]
		},
		body: resizedImage.toString("base64"),
		bodyEncoding: "base64"
	};
	callback(null, callbackFn);
};
