// Compatibility shim: re-export the main API module located in src/api
// Some components import from 'lib/api/careLogs' (older path). Keep a small wrapper
// so both import styles work without changing many files.

export * from '../../api/careLogs';

// Also re-export the default api object if present
import { careLogsApi } from '../../api/careLogs';
export default careLogsApi;
