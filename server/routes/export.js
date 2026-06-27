// ============================================
// 导出相关路由：Excel 导出 + PDF 生成
// ============================================
const router = require('express').Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/export/orders-excel — 导出我的订单为 Excel 文件
 * 使用 exceljs 库生成 .xlsx
 */
router.get('/orders-excel', authMiddleware, async (req, res) => {
  try {
    const { type = 'buy' } = req.query;

    // 查询订单数据
    let sql, params = [req.user.id];
    if (type === 'sell') {
      sql = `
        SELECT o.order_no, p.title, o.amount, o.status, u.nickname AS counterparty,
               o.trade_location, o.trade_time, o.created_at
        FROM orders o
        JOIN products p ON o.product_id = p.id
        JOIN users u ON o.buyer_id = u.id
        WHERE o.seller_id = ?
        ORDER BY o.created_at DESC`;
    } else {
      sql = `
        SELECT o.order_no, p.title, o.amount, o.status, u.nickname AS counterparty,
               o.trade_location, o.trade_time, o.created_at
        FROM orders o
        JOIN products p ON o.product_id = p.id
        JOIN users u ON o.seller_id = u.id
        WHERE o.buyer_id = ?
        ORDER BY o.created_at DESC`;
    }

    const [rows] = await pool.query(sql, params);

    // 创建 Excel 工作簿
    const workbook = new ExcelJS.Workbook();
    workbook.creator = '校园二手交易平台';

    const worksheet = workbook.addWorksheet('订单记录');

    // 设置列
    worksheet.columns = [
      { header: '订单编号', key: 'order_no', width: 20 },
      { header: '商品名称', key: 'title', width: 30 },
      { header: '金额', key: 'amount', width: 12 },
      { header: '订单状态', key: 'status', width: 12 },
      { header: type === 'sell' ? '买家' : '卖家', key: 'counterparty', width: 15 },
      { header: '交易地点', key: 'trade_location', width: 25 },
      { header: '交易时间', key: 'trade_time', width: 18 },
      { header: '下单时间', key: 'created_at', width: 20 }
    ];

    // 标题行样式（蓝色主题）
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B8DEF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // 填入数据
    rows.forEach(row => {
      worksheet.addRow({
        order_no: row.order_no,
        title: row.title,
        amount: `¥${row.amount}`,
        status: row.status,
        counterparty: row.counterparty,
        trade_location: row.trade_location,
        trade_time: row.trade_time,
        created_at: row.created_at
      });
    });

    // 数据行样式
    worksheet.eachRow((row, num) => {
      if (num > 1) {
        row.alignment = { vertical: 'middle', horizontal: 'center' };
        row.height = 24;
      }
    });

    // 设置响应头并输出
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('导出Excel错误:', err);
    res.status(500).json({ code: 500, message: '导出Excel失败' });
  }
});

/**
 * GET /api/export/order-pdf/:id — 导出单个订单为 PDF 凭证
 * 使用 pdfkit 库生成
 */
router.get('/order-pdf/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 查询订单详情
    const [rows] = await pool.query(
      `SELECT o.*, p.title AS product_title,
              buyer.nickname AS buyer_name, seller.nickname AS seller_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN users buyer ON o.buyer_id = buyer.id
       JOIN users seller ON o.seller_id = seller.id
       WHERE o.id = ?`,
      [id]
    );

    if (rows.length === 0) return res.json({ code: 404, message: '订单不存在' });

    const order = rows[0];

    // 创建 PDF 文档
    const doc = new PDFDocument({ size: 'A5', margin: 30 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order_${order.order_no}.pdf`);
    doc.pipe(res);

    // ---- PDF 内容绘制 ----

    // 蓝色顶部装饰条
    doc.rect(0, 0, doc.page.width, 40).fill('#5B8DEF');

    // 标题
    doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold')
       .text('校园二手交易平台', 30, 10, { align: 'center' });

    doc.fillColor('#333333').fontSize(11).font('Helvetica');

    const y0 = 55;

    // 订单信息框
    doc.rect(20, y0, doc.page.width - 40, 28).fill('#EBF1FB');
    doc.fillColor('#1a3a6b').fontSize(13).font('Helvetica-Bold')
       .text('📋 交易凭证', 25, y0 + 6);

    // 分隔线
    const y1 = y0 + 40;
    doc.moveTo(25, y1).lineTo(doc.page.width - 25, y1).strokeColor('#5B8DEF').lineWidth(1.5).stroke();

    // 订单详情
    const info = [
      ['订单编号', order.order_no],
      ['商品名称', order.product_title],
      ['交易金额', `¥${order.amount}`],
      ['订单状态', order.status],
      ['买家', order.buyer_name],
      ['卖家', order.seller_name],
      ['交易地点', order.trade_location || '未指定'],
      ['交易时间', order.trade_time || '待约定'],
      ['下单时间', new Date(order.created_at).toLocaleString('zh-CN')]
    ];

    let y = y1 + 10;
    info.forEach(([label, value]) => {
      doc.fillColor('#666666').fontSize(9).font('Helvetica')
         .text(label, 30, y);
      doc.fillColor('#333333').fontSize(10).font('Helvetica-Bold')
         .text(value, 120, y);
      y += 22;
    });

    // 底部
    doc.fillColor('#999999').fontSize(8).font('Helvetica')
       .text('感谢使用校园二手交易平台！如有问题请联系客服。', 30, y + 20, { align: 'center' });

    // 蓝色底部装饰条
    doc.rect(0, doc.page.height - 20, doc.page.width, 20).fill('#5B8DEF');

    doc.end();
  } catch (err) {
    console.error('生成PDF错误:', err);
    res.status(500).json({ code: 500, message: '生成PDF失败' });
  }
});

module.exports = router;
