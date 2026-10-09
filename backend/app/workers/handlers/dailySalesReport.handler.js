/**
 * Predefined Handler for DAILY_SALES_REPORT
 * Executes daily factory / sales report compilation.
 */
module.exports = async function handleDailySalesReport(payload) {
  const factoryId = payload.factoryId || 'DEFAULT';
  console.log(`[JobHandler: DAILY_SALES_REPORT] Compiling sales report for factory ${factoryId}...`);

  // Simulate business service processing delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    reportType: 'DAILY_SALES_REPORT',
    factoryId,
    generatedAt: new Date().toISOString(),
    status: 'COMPLETED',
    metrics: {
      totalSales: Math.floor(Math.random() * 100000) + 50000,
      ordersProcessed: Math.floor(Math.random() * 500) + 100
    }
  };
};
