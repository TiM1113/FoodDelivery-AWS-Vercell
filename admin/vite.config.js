import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	define: {
		'import.meta.env.VITE_API_URL': JSON.stringify(
			process.env.VITE_API_URL || ''
		),
		'import.meta.env.VITE_S3_URL': JSON.stringify(
			process.env.VITE_S3_URL || ''
		),
	},
	server: {
		historyApiFallback: true,
	},
});
