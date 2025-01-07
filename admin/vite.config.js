import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	define: {
		'process.env': {
			REACT_APP_API_URL: process.env.REACT_APP_API_URL || '',
			REACT_APP_S3_URL: process.env.REACT_APP_S3_URL || '',
		},
	},
	server: {
		historyApiFallback: true,
	},
});
