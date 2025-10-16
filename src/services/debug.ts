class DebugService {
  async insertLargeDataToDB() {
    // await DEBUG_MODEL.createRandomData({
    //   messageCount: 100_000,
    //   sessionCount: 40,
    //   startIndex: 0,
    //   topicCount: 200,
    // });
    //
    //
    // await DEBUG_MODEL.createRandomData({
    //   messageCount: 300_000,
    //   sessionCount: 40,
    //   startIndex: 100_001,
    //   topicCount: 200,
    // });
    //
    // await DEBUG_MODEL.createRandomData({
    //   messageCount: 300_000,
    //   sessionCount: 40,
    //   startIndex: 400_001,
    //   topicCount: 200,
    // });
    //
    // await DEBUG_MODEL.createRandomData({
    //   messageCount: 300_000,
    //   sessionCount: 40,
    //   startIndex: 700_001,
    //   topicCount: 200,
    // });
  }
}

export const debugService = new DebugService();
