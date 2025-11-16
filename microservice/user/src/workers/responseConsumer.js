const { consume } = require('../utils/rabbitmq');
const logger = require('../utils/logger'); // Logger để ghi log

const demo = async (data) => {
    logger.info('Demo function called with data:', data);
    // Xử lý dữ liệu ở đây
}

async function startResponseConsumer() {
    await consume('user.response.queue', 'user.response.generated', demo);
}

module.exports = { startResponseConsumer };
