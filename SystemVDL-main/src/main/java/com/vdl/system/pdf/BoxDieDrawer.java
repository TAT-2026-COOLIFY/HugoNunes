package com.vdl.system.pdf;

import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfContentByte;
import com.vdl.system.domain.model.OrcamentoItens;

public class BoxDieDrawer {

    private static final float MM = 2.83465f;

    private static float pt(float mm) {
        return mm * MM;
    }

    public static void drawIllustration(
            PdfContentByte cb,
            OrcamentoItens item,
            float originXmm, float originYmm,
            float maxWmm, float maxHmm
    ) {
        // ==========================================================
        // TEMPLATE FIXO (estilo VDL) - desenho não muda nunca
        // ==========================================================
        float p1 = 381f, p2 = 205f, p3 = 385f, p4 = 205f, p5 = 30f;
        float sum = p1 + p2 + p3 + p4 + p5;

        // tamanho “visual” do molde na página (ajuste fino se quiser maior/menor)
        float TEMPLATE_TOTAL_W = 155f;

        float w1 = TEMPLATE_TOTAL_W * (p1 / sum);
        float w2 = TEMPLATE_TOTAL_W * (p2 / sum);
        float w3 = TEMPLATE_TOTAL_W * (p3 / sum);
        float w4 = TEMPLATE_TOTAL_W * (p4 / sum);
        float w5 = TEMPLATE_TOTAL_W * (p5 / sum);

        // proporção vertical do modelo: 104 / 320 / 104
        float bodyH = 70f;
        float flapH = bodyH * (104f / 320f);

        float moldeW = w1 + w2 + w3 + w4 + w5;
        float moldeH = flapH + bodyH + flapH;

        // margens p/ cotas (fixas)
        float mLeft = 24f, mRight = 24f, mTop = 22f, mBottom = 30f;

        float needW = moldeW + mLeft + mRight;
        float needH = moldeH + mBottom + mTop;

        float scale = Math.min(maxWmm / needW, maxHmm / needH);
        if (scale <= 0f) scale = 0.1f;

        float tx = originXmm + (maxWmm - needW * scale) / 2f;
        float ty = originYmm + (maxHmm - needH * scale) / 2f;

        float x0 = mLeft;
        float y0 = mBottom;

        // 1) Geometria (escala)
        cb.saveState();
        cb.concatCTM(scale, 0, 0, scale, pt(tx), pt(ty));
        drawGeometryVDL(cb, x0, y0, w1, w2, w3, w4, w5, flapH, bodyH);
        cb.restoreState();

        // 2) Cotas (sem escala)
        cb.saveState();
        drawDimensionsVDL(cb, item, tx, ty, scale, x0, y0, w1, w2, w3, w4, w5, flapH, bodyH);
        cb.restoreState();
    }

    // =====================================================
    // GEOMETRIA (igual ao PDF VDL)
    // - contorno externo total
    // - linhas internas longas
    // - cola com “dupla linha”
    // =====================================================
    private static void drawGeometryVDL(
            PdfContentByte cb,
            float x0, float y0,
            float w1, float w2, float w3, float w4, float w5,
            float flapH, float bodyH
    ) {
        cb.setLineWidth(2.6f);
        cb.setLineCap(PdfContentByte.LINE_CAP_BUTT);

        float yBody = y0 + flapH;
        float yTop = yBody + bodyH;
        float yAllTop = yTop + flapH;

        float x1 = x0 + w1;
        float x2 = x1 + w2;
        float x3 = x2 + w3;
        float x4 = x3 + w4;
        float x5 = x4 + w5;

        // contorno externo total
        rect(cb, x0, y0, (x5 - x0), (yAllTop - y0));

        // horizontais do corpo (atravessam tudo)
        line(cb, x0, yBody, x5, yBody);
        line(cb, x0, yTop, x5, yTop);

        // verticais dos painéis (altura total)
        line(cb, x1, y0, x1, yAllTop);
        line(cb, x2, y0, x2, yAllTop);
        line(cb, x3, y0, x3, yAllTop);
        line(cb, x4, y0, x4, yAllTop);

        // dupla linha da cola (linha interna só no corpo)
        float glueInnerX = x5 - (w5 * 0.35f);
        line(cb, glueInnerX, yBody, glueInnerX, yTop);

        cb.stroke();
    }

    // =====================================================
    // COTAS (posições fixas, valores reais do item)
    // =====================================================
    private static void drawDimensionsVDL(
            PdfContentByte cb,
            OrcamentoItens item,
            float tx, float ty, float s,
            float x0, float y0,
            float w1, float w2, float w3, float w4, float w5,
            float flapH, float bodyH
    ) {
        Font fTop = new Font(Font.HELVETICA, 12, Font.BOLD);
        Font fSide = new Font(Font.HELVETICA, 12, Font.BOLD);
        Font fTotal = new Font(Font.HELVETICA, 14, Font.BOLD);
        Font fSmall = new Font(Font.HELVETICA, 10, Font.BOLD);

        cb.setLineWidth(1.2f);
        cb.setLineCap(PdfContentByte.LINE_CAP_BUTT);

        float L = item.getLargura().floatValue();
        float A = item.getAltura().floatValue();
        float C = item.getComprimento().floatValue();

        float cMenos4 = C - 4f;
        float abaCola = 30f;

        boolean kraft = isKraft(item);
        int meiaShow = meiaLarguraShow(L, kraft);
        int totalVShow = (int) Math.round(A) + (meiaShow * 2);
        int totalWShow = (int) Math.round((C - 4f) + L + C + L + abaCola);

        float yBody = y0 + flapH;
        float yTop = yBody + bodyH;
        float yAllTop = yTop + flapH;

        float x1 = x0 + w1;
        float x2 = x1 + w2;
        float x3 = x2 + w3;
        float x4 = x3 + w4;
        float x5 = x4 + w5;

        float gapExtPt = pt(3.0f);
        float textOffsetPt = pt(3.5f);
        float arrowSizePt = pt(2.2f);
        float dimOffsetTopPt = pt(7.0f);

        // TOP (parciais)
        float yRefTopPt = mmToPtY(ty, yAllTop, s);
        float yDimTopPt = yRefTopPt + dimOffsetTopPt;

        dimH(cb, fTop, tx, ty, s, x0, x1, yAllTop, yDimTopPt, Math.round(cMenos4), true, gapExtPt, textOffsetPt, arrowSizePt);
        dimH(cb, fTop, tx, ty, s, x1, x2, yAllTop, yDimTopPt, Math.round(L), true, gapExtPt, textOffsetPt, arrowSizePt);
        dimH(cb, fTop, tx, ty, s, x2, x3, yAllTop, yDimTopPt, Math.round(C), true, gapExtPt, textOffsetPt, arrowSizePt);
        dimH(cb, fTop, tx, ty, s, x3, x4, yAllTop, yDimTopPt, Math.round(L), true, gapExtPt, textOffsetPt, arrowSizePt);

        // cola (30) referenciando topo do corpo
        dimH(cb, fSmall, tx, ty, s, x4, x5, yTop, yDimTopPt, Math.round(abaCola), true, gapExtPt, textOffsetPt, arrowSizePt);

        // BOTTOM TOTAL (abaixar mais/menos aqui)
        float bottomDistanceMm = 32f; // <<< ajuste fino (ex: 30, 32, 35)
        float yRefBotPt = mmToPtY(ty, yBody, s);
        float yDimBotPt = yRefBotPt - pt(bottomDistanceMm);

        dimH(cb, fTotal, tx, ty, s, x0, x5, yBody, yDimBotPt, totalWShow, false, gapExtPt, textOffsetPt, arrowSizePt);

        // LEFT (meia / altura / meia)
        float xRefLeftPt = mmToPtX(tx, x0, s);
        float xDimLeftPt = xRefLeftPt - pt(8.0f);

        dimV(cb, fSide, tx, ty, s, y0, yBody, x0, xDimLeftPt, meiaShow, -1, gapExtPt, textOffsetPt, arrowSizePt);
        dimV(cb, fSide, tx, ty, s, yBody, yTop, x0, xDimLeftPt, Math.round(A), -1, gapExtPt, textOffsetPt, arrowSizePt);
        dimV(cb, fSide, tx, ty, s, yTop, yAllTop, x0, xDimLeftPt, meiaShow, -1, gapExtPt, textOffsetPt, arrowSizePt);

        // RIGHT total vertical
        float xRefRightPt = mmToPtX(tx, x5, s);
        float xDimRightPt = xRefRightPt + pt(8.0f);

        dimV(cb, fSide, tx, ty, s, y0, yAllTop, x5, xDimRightPt, totalVShow, +1, gapExtPt, textOffsetPt, arrowSizePt);
    }

    private static void dimH(
            PdfContentByte cb, Font font,
            float txMm, float tyMm, float s,
            float xAmm, float xBmm,
            float yRefMm, float yDimPt,
            int value, boolean textAbove,
            float gapExtPt, float textOffsetPt, float arrowSizePt
    ) {
        float x1 = mmToPtX(txMm, xAmm, s);
        float x2 = mmToPtX(txMm, xBmm, s);
        float yRef = mmToPtY(tyMm, yRefMm, s);

        float dir = (yDimPt >= yRef) ? 1f : -1f;

        cb.moveTo(x1, yRef);
        cb.lineTo(x1, yDimPt - (dir * gapExtPt));
        cb.moveTo(x2, yRef);
        cb.lineTo(x2, yDimPt - (dir * gapExtPt));

        cb.moveTo(x1, yDimPt);
        cb.lineTo(x2, yDimPt);
        cb.stroke();

        arrowH(cb, x1, yDimPt, +1, arrowSizePt);
        arrowH(cb, x2, yDimPt, -1, arrowSizePt);

        float textY = textAbove ? (yDimPt + textOffsetPt) : (yDimPt - textOffsetPt - pt(4f));
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase(String.valueOf(value), font),
                (x1 + x2) / 2f, textY, 0);
    }

    private static void dimV(
            PdfContentByte cb, Font font,
            float txMm, float tyMm, float s,
            float yAmm, float yBmm,
            float xRefMm, float xDimPt,
            int value, int side,
            float gapExtPt, float textOffsetPt, float arrowSizePt
    ) {
        float y1 = mmToPtY(tyMm, yAmm, s);
        float y2 = mmToPtY(tyMm, yBmm, s);
        float xRef = mmToPtX(txMm, xRefMm, s);

        cb.moveTo(xRef, y1);
        cb.lineTo(xDimPt - (side * gapExtPt), y1);

        cb.moveTo(xRef, y2);
        cb.lineTo(xDimPt - (side * gapExtPt), y2);

        cb.moveTo(xDimPt, y1);
        cb.lineTo(xDimPt, y2);
        cb.stroke();

        arrowV(cb, xDimPt, y1, +1, arrowSizePt);
        arrowV(cb, xDimPt, y2, -1, arrowSizePt);

        float textX = xDimPt + (side * (textOffsetPt + pt(2f)));
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase(String.valueOf(value), font),
                textX, (y1 + y2) / 2f, 90);
    }

    private static void arrowH(PdfContentByte cb, float x, float y, int dir, float size) {
        cb.moveTo(x, y);
        cb.lineTo(x + dir * size, y + size * 0.55f);
        cb.lineTo(x + dir * size, y - size * 0.55f);
        cb.closePathFillStroke();
    }

    private static void arrowV(PdfContentByte cb, float x, float y, int dir, float size) {
        cb.moveTo(x, y);
        cb.lineTo(x + size * 0.55f, y + dir * size);
        cb.lineTo(x - size * 0.55f, y + dir * size);
        cb.closePathFillStroke();
    }

    private static float mmToPtX(float txMm, float xMm, float s) {
        return pt(txMm + (xMm * s));
    }

    private static float mmToPtY(float tyMm, float yMm, float s) {
        return pt(tyMm + (yMm * s));
    }

    private static void rect(PdfContentByte cb, float x, float y, float w, float h) {
        cb.rectangle(pt(x), pt(y), pt(w), pt(h));
    }

    private static void line(PdfContentByte cb, float x1, float y1, float x2, float y2) {
        cb.moveTo(pt(x1), pt(y1));
        cb.lineTo(pt(x2), pt(y2));
    }

    private static int meiaLarguraShow(float L, boolean kraft) {
        float add = kraft ? 2f : 1f;
        return (int) Math.ceil((L / 2f) + add);
    }

    private static boolean isKraft(OrcamentoItens item) {
        try {
            String desc = item.getGramatura().getDescGramatura();
            if (desc == null) return false;
            return desc.toLowerCase().contains("kraft");
        } catch (Exception e) {
            return false;
        }
    }
}