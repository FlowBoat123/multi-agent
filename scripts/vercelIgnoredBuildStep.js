const { execSync } = require('node:child_process');

const branchName = process.env.VERCEL_GIT_COMMIT_REF || '';

function shouldProceedBuild() {
  if (branchName === 'lighthouse' || branchName.startsWith('gru/')) {
    return false;
  }

  try {
    const diffCommand =
      'git diff HEAD^ HEAD --quiet -- \
      ":!./*.md" \
      ":!./Dockerfile" \
      ":!./.github" \
      ":!./.husky" \
      ":!./scripts"';

    execSync(diffCommand);

    return false;
  } catch {
    return true;
  }
}

const shouldBuild = shouldProceedBuild();

console.log('shouldBuild:', shouldBuild);
if (shouldBuild) {
  console.log('✅ - Build can proceed');
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
} else {
  console.log('🛑 - Build cancelled');
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(0);
}
