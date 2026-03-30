import os


def _sync_deepseek_env():
	"""Ensure ChatOpenAI-compatible env vars are present when only DeepSeek key is configured."""
	deepseek_key = os.environ.get('DEEPSEEK_API_KEY')

	if deepseek_key and not os.environ.get('OPENAI_API_KEY'):
		os.environ['OPENAI_API_KEY'] = deepseek_key


_sync_deepseek_env()
