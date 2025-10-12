import { register } from '@agent/observability-otel/node'
import { version } from '../package.json';

register({ version })
