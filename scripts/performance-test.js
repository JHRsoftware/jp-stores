const { performance } = require('perf_hooks');
const fetch = require('node-fetch');

// Performance testing script
async function runPerformanceTests() {
  console.log('🚀 Running Performance Tests...\n');
  
  const baseURL = 'http://localhost:3000';
  const tests = [
    { name: 'Homepage Load', url: '/' },
    { name: 'Dashboard Page', url: '/dashboard' },
    { name: 'Customer API', url: '/api/customers' },
    { name: 'Products API', url: '/api/products/item' },
    { name: 'Invoice Stats API', url: '/api/invoice/stats', method: 'POST', body: { filterType: 'day' } }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    
    const startTime = performance.now();
    
    try {
      const options = {
        method: test.method || 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(`${baseURL}${test.url}`, options);
      const endTime = performance.now();
      
      const duration = Math.round(endTime - startTime);
      const status = response.ok ? '✅' : '❌';
      const rating = duration < 500 ? 'EXCELLENT' : 
                    duration < 1000 ? 'GOOD' : 
                    duration < 2000 ? 'FAIR' : 'POOR';
      
      results.push({
        name: test.name,
        duration,
        status,
        rating,
        statusCode: response.status
      });
      
      console.log(`${status} ${test.name}: ${duration}ms (${rating})`);
      
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
      results.push({
        name: test.name,
        duration: 0,
        status: '❌',
        rating: 'ERROR',
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n📊 Performance Test Summary:');
  console.log('================================');
  
  const avgTime = results
    .filter(r => r.duration > 0)
    .reduce((sum, r) => sum + r.duration, 0) / results.length;
  
  const passedTests = results.filter(r => r.status === '✅').length;
  const totalTests = results.length;
  
  console.log(`Average Response Time: ${Math.round(avgTime)}ms`);
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  // Performance ratings
  const excellent = results.filter(r => r.rating === 'EXCELLENT').length;
  const good = results.filter(r => r.rating === 'GOOD').length;
  const fair = results.filter(r => r.rating === 'FAIR').length;
  const poor = results.filter(r => r.rating === 'POOR').length;
  
  console.log('\nPerformance Breakdown:');
  console.log(`🚀 Excellent (<500ms): ${excellent}`);
  console.log(`✅ Good (500-1000ms): ${good}`);
  console.log(`⚠️  Fair (1000-2000ms): ${fair}`);
  console.log(`❌ Poor (>2000ms): ${poor}`);
  
  if (avgTime < 500) {
    console.log('\n🎉 EXCELLENT PERFORMANCE! Your app is super fast!');
  } else if (avgTime < 1000) {
    console.log('\n✅ GOOD PERFORMANCE! Your app is fast and responsive.');
  } else if (avgTime < 2000) {
    console.log('\n⚠️  FAIR PERFORMANCE. Consider optimizations.');
  } else {
    console.log('\n❌ POOR PERFORMANCE. Optimization needed.');
  }
}

// Run tests if called directly
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = { runPerformanceTests };