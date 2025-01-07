import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode}) => {
	const env = loadEnv(mode, process.cwd(), '');
	return {
		plugins: [react()],
		define: {
			'process.env.REACT_APP_API_URL': JSON.stringify(
				env.REACT_APP_API_URL || ''
			),
			'process.env.REACT_APP_S3_URL': JSON.stringify(
				env.REACT_APP_S3_URL || ''
			),
		},
		server: {
			historyApiFallback: true,
		},
	};
});
