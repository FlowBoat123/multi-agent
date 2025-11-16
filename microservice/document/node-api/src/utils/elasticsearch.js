const { Client } = require('@elastic/elasticsearch');

async function ensureDataStreamExists(dataStreamName, elasticsearchUrl) {
    const client = new Client({
        node: elasticsearchUrl,
        // Add basic error handling for connection
        requestTimeout: 30000,
        pingTimeout: 3000
    });

    try {
        // Step 1: Create index template for the data stream
        const templateName = `${dataStreamName}-template`;

        await client.indices.putIndexTemplate({
            name: templateName,
            body: {
                index_patterns: [`${dataStreamName}-*`],
                data_stream: {},
                template: {
                    settings: {
                        number_of_shards: 1,
                        number_of_replicas: 0,
                        // Optimize for log data
                        'index.refresh_interval': '5s',
                        'index.codec': 'best_compression'
                    },
                    mappings: {
                        properties: {
                            '@timestamp': {
                                type: 'date'
                            },
                            message: {
                                type: 'text',
                                fields: {
                                    keyword: {
                                        type: 'keyword',
                                        ignore_above: 256
                                    }
                                }
                            },
                            level: {
                                type: 'keyword'
                            },
                            // Add common log fields
                            userId: {
                                type: 'keyword'
                            },
                            action: {
                                type: 'keyword'
                            },
                            ip: {
                                type: 'ip'
                            }
                        }
                    }
                },
                priority: 200,
                composed_of: [],
                version: 1,
                _meta: {
                    description: `Template for ${dataStreamName} data stream`
                }
            }
        });

        console.log(`Index template "${templateName}" created or updated.`);

        // Step 2: Check if data stream exists
        try {
            await client.indices.getDataStream({
                name: dataStreamName
            });
            console.log(`Data stream "${dataStreamName}" already exists.`);
        } catch (error) {
            if (error.statusCode === 404) {
                // Step 3: Create data stream if it doesn't exist
                await client.indices.createDataStream({
                    name: dataStreamName
                });
                console.log(`Data stream "${dataStreamName}" created successfully.`);
            } else {
                throw error;
            }
        }

        // Step 4: Verify data stream is ready
        const dataStreamInfo = await client.indices.getDataStream({
            name: dataStreamName
        });

        console.log(`Data stream "${dataStreamName}" is ready with ${dataStreamInfo.body.data_streams[0].indices.length} backing indices.`);

        return true;

    } catch (error) {
        console.error(`Error ensuring data stream "${dataStreamName}":`, error.message);

        // If it's a connection error, provide helpful info
        if (error.code === 'ECONNREFUSED') {
            console.error(`Cannot connect to Elasticsearch at ${elasticsearchUrl}. Make sure it's running.`);
        }

        throw error;
    } finally {
        // Close the client connection
        await client.close();
    }
}

// Helper function to delete data stream (for testing/cleanup)
async function deleteDataStream(dataStreamName, elasticsearchUrl) {
    const client = new Client({ node: elasticsearchUrl });

    try {
        await client.indices.deleteDataStream({
            name: dataStreamName
        });
        console.log(`Data stream "${dataStreamName}" deleted.`);

        // Also delete the template
        await client.indices.deleteIndexTemplate({
            name: `${dataStreamName}-template`
        });
        console.log(`Template "${dataStreamName}-template" deleted.`);

    } catch (error) {
        console.error(`Error deleting data stream "${dataStreamName}":`, error.message);
        throw error;
    } finally {
        await client.close();
    }
}

module.exports = {
    ensureDataStreamExists,
    deleteDataStream
};