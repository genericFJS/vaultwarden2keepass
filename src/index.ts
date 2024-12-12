import { executeBackup } from './executeBackup';

function success() {
  console.log('🎉 Backup completed successfully');
  process.exit(0);
}

executeBackup().then(
  () => {
    console.log('🎉 Backup completed successfully');
    process.exit(0);
  },
  (reason) => {
    console.log('🛑 Backup did not complete successfully', reason);
    process.exit(1);
  },
);
