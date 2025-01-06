import 'dotenv/config';
import mongoose from 'mongoose';
import {S3Client} from '@aws-sdk/client-s3';

async function testSetup() {
	console.log('\n🔍 Testing Environment Setup...\n');

	// 1. Test Environment Variables
	console.log('1️⃣ Checking Environment Variables:');
	const requiredEnvVars = [
		'MONGODB_URI',
		'JWT_SECRET',
		'AWS_ACCESS_KEY_ID',
		'AWS_SECRET_ACCESS_KEY',
		'AWS_REGION',
		'AWS_BUCKET_NAME',
	];

	let envErrors = false;
	requiredEnvVars.forEach((varName) => {
		if (!process.env[varName]) {
			console.log(`❌ Missing ${varName}`);
			envErrors = true;
		} else {
			console.log(`✅ ${varName} is set`);
		}
	});

	// 2. Test MongoDB Connection
	console.log('\n2️⃣ Testing MongoDB Connection:');
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('✅ MongoDB connected successfully');
		await mongoose.disconnect();
	} catch (error) {
		console.log('❌ MongoDB connection failed:', error.message);
		envErrors = true;
	}

	// 3. Test AWS Configuration
	console.log('\n3️⃣ Testing AWS Configuration:');
	try {
		const s3Client = new S3Client({
			region: process.env.AWS_REGION,
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
			},
		});
		console.log('✅ AWS S3 client created successfully');
	} catch (error) {
		console.log('❌ AWS S3 client creation failed:', error.message);
		envErrors = true;
	}

	console.log('\n📝 Test Summary:');
	if (envErrors) {
		console.log(
			'❌ Some tests failed. Please fix the issues above before deploying.'
		);
		process.exit(1);
	} else {
		console.log('✅ All tests passed! Ready for deployment.');
	}
}

testSetup().catch(console.error);
