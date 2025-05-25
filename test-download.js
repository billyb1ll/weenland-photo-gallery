// Test script to verify Lorem Picsum URL downloads

async function testImageDownload() {
    const testUrl = 'https://picsum.photos/1200/800?random=1';

    try {
        console.log(`Testing download from: ${testUrl}`);

        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*,*/*;q=0.8',
            },
            redirect: 'follow',
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const imageBuffer = await response.arrayBuffer();
            console.log(`Downloaded image size: ${imageBuffer.byteLength} bytes`);
            console.log('SUCCESS: Image downloaded successfully');
        } else {
            console.error('FAILED: Response not OK');
        }
    } catch (error) {
        console.error('ERROR:', error.message);
    }
}

testImageDownload();
