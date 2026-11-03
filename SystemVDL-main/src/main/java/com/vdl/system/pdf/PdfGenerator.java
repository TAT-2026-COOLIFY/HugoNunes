package com.vdl.system.pdf;

import java.io.InputStream;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import java.awt.Color;
import com.vdl.system.domain.dto.pdf.OrdemCompraPdfDTO;
import com.vdl.system.domain.dto.pdf.OrdemEntregaPdfDTO;
import com.vdl.system.domain.model.OrcamentoItens;
import com.vdl.system.domain.model.OrdemServico;
import com.vdl.system.infra.exception.ordemServico.OrdemServicoNaoEncontradaException;
import com.vdl.system.services.OrdemServicoServices;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

public class PdfGenerator {

    // =================================================================================
    // ORÇAMENTO — NOVO LAYOUT (cabeçalho da empresa, cartões do cliente, tabela colorida,
    // condições com "ícones"). Mesmos dados de entrada de antes.
    // Cabeçalho se repete automaticamente em TODAS as páginas.
    // =================================================================================

    // ----- Dados fixos da empresa: EDITE AQUI com as informações reais -----
    private static final String EMPRESA_NOME = "VDL EMBALAGENS";
    private static final String EMPRESA_TAGLINE = "SUA SOLUÇÃO EM CAIXAS DE PAPELÃO";
    private static final String EMPRESA_TELEFONE = "(18) 99614-4665";
    private static final String EMPRESA_ENDERECO_L1 = "Rua José Bomquembizo, 105";
    private static final String EMPRESA_ENDERECO_L2 = "Assis/SP - CEP 19807-130";
    private static final String EMPRESA_CNPJ = "46.970.897/0001-87";
    private static final String EMPRESA_CIDADE = "Assis";

    private static final Color COR_NAVY = new Color(18, 24, 38);
    private static final Color COR_AZUL = new Color(23, 98, 214);
    private static final Color COR_AZUL_CLARO = new Color(230, 240, 253);
    private static final Color COR_CINZA_CLARO = new Color(244, 246, 249);
    private static final Color COR_CINZA_TEXTO = new Color(110, 118, 130);

    private static final float MM = 2.83465f;
    private static final float HEADER_HEIGHT_PT = 40f * MM;

    public static ByteArrayInputStream gerarOrcamentoPdf(
            String numero,
            String cliente,
            String telefone,
            LocalDate dataCriacao,
            List<OrcamentoItens> itens,
            int diasUteis,
            String coresPdf
    ) {
        Document document = new Document(PageSize.A4, 28f, 28f, HEADER_HEIGHT_PT + 14f, 24f);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new OrcamentoPageEvent(numero, dataCriacao));
            document.open();

            // ===================== CORPO =====================
            Font normal = new Font(Font.HELVETICA, 9.5f, Font.NORMAL, Color.BLACK);
            Font header = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
            Font headerSub = new Font(Font.HELVETICA, 8, Font.BOLD, Color.WHITE);

            // --- Banner "DADOS DO CLIENTE" ---
            document.add(criarBannerSecao("DADOS DO CLIENTE"));
            document.add(new Paragraph(" ", new Font(Font.HELVETICA, 4)));

            // --- Cartões do cliente (Cliente / Contato / Departamento / E-mail / A/C) ---
            document.add(criarCartoesCliente(cliente, telefone));
            document.add(Chunk.NEWLINE);

            // --- Tabela de itens (estilo colorido, com cabeçalho de 2 linhas) ---
            PdfPTable tabela = new PdfPTable(9);
            tabela.setWidthPercentage(100);
            tabela.setSpacingBefore(6f);
            tabela.setWidths(new float[]{1.15f, 0.85f, 0.85f, 0.85f, 1.35f, 0.95f, 0.95f, 1.05f, 0.95f});

            PdfPCell cModelo = new PdfPCell(new Phrase("MODELO", header));
            cModelo.setRowspan(2);
            estilizarCabecalho(cModelo, COR_AZUL);
            tabela.addCell(cModelo);

            PdfPCell cDim = new PdfPCell(new Phrase("DIMENSÕES EXTERNA (MM)", header));
            cDim.setColspan(3);
            estilizarCabecalho(cDim, COR_AZUL);
            tabela.addCell(cDim);

            PdfPCell cGram = new PdfPCell(new Phrase("GRAMATURA", header));
            cGram.setRowspan(2);
            estilizarCabecalho(cGram, COR_AZUL);
            tabela.addCell(cGram);

            PdfPCell cQtd = new PdfPCell(new Phrase("PREÇO UNITÁRIO (R$)", header));
            cQtd.setColspan(3);
            estilizarCabecalho(cQtd, COR_AZUL);
            tabela.addCell(cQtd);

            PdfPCell cPers = new PdfPCell(new Phrase("PERSONA-\nLIZAÇÃO", header));
            cPers.setRowspan(2);
            estilizarCabecalho(cPers, COR_AZUL);
            tabela.addCell(cPers);

            tabela.addCell(celulaHeaderSub("COMPR. (C)", headerSub));
            tabela.addCell(celulaHeaderSub("LARG. (L)", headerSub));
            tabela.addCell(celulaHeaderSub("ALT. (A)", headerSub));
            tabela.addCell(celulaHeaderSub("1 a 300", headerSub));
            tabela.addCell(celulaHeaderSub("301 a 800", headerSub));
            tabela.addCell(celulaHeaderSub("Acima de 800", headerSub));

            boolean algumaPersonalizada = false;

            int i = 1;
            for (var item : itens) {
                boolean zebra = (i % 2 == 0);
                Color bg = zebra ? COR_CINZA_CLARO : Color.WHITE;
                boolean personalizada = Boolean.TRUE.equals(item.getPersonalizada());
                if (personalizada) algumaPersonalizada = true;

                tabela.addCell(celulaCorpo("Caixa nº " + i, normal, bg, Element.ALIGN_LEFT, true));
                tabela.addCell(celulaCorpo(item.getComprimento().intValue() + "", normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(item.getLargura().intValue() + "", normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(item.getAltura().intValue() + "", normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(
                        item.getGramatura().getDescGramatura(),
                        normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(formatar(item.getValorQtdPequena()), normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(formatar(item.getValorQtdMedia()), normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(formatar(item.getValorQtdGrande()), normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaPersonalizacao(personalizada, bg));
                i++;
            }

            document.add(tabela);

            // --- Linha de destaque com as cores escolhidas (só aparece se alguma caixa for personalizada) ---
            if (algumaPersonalizada && coresPdf != null && !coresPdf.isBlank()) {
                document.add(new Paragraph(" ", new Font(Font.HELVETICA, 3)));
                document.add(criarFaixaPersonalizacao(coresPdf));
            }

            document.add(new Paragraph(" ", new Font(Font.HELVETICA, 5)));

            // --- Banner "CONDIÇÕES GERAIS" ---
            document.add(criarBannerSecao("CONDIÇÕES GERAIS"));
            document.add(new Paragraph(" ", new Font(Font.HELVETICA, 3)));

            document.add(criarItemCondicao("P", "PRAZO DE ENTREGA",
                    "Até " + diasUteis + " dias úteis após aprovação do pedido e/ou pagamento da entrada."));
            document.add(criarItemCondicao("$", "CONDIÇÕES DE PAGAMENTO",
                    "À vista, cartão ou, mediante aprovação financeira, 30% de entrada e saldo em 20 dias via boleto bancário."));
            document.add(criarItemCondicao("F", "FRETE",
                    "Entregamos em " + EMPRESA_CIDADE + "/SP. Para demais localidades, o frete é por conta do cliente."));
            document.add(criarItemCondicao("I", "IMPRESSÃO",
                    "Até duas cores sem custo adicional na unidade da caixa. Será cobrado apenas o valor referente à confecção do clichê."));
            document.add(criarItemCondicao("V", "VALIDADE DO ORÇAMENTO",
                    "Válido por 15 dias a partir da emissão. Após esse prazo, consulte novamente antes de fechar o pedido."));

            document.close();

        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    // =================================================================================
    // Evento de página: redesenha o cabeçalho em TODAS as páginas
    // (se o orçamento tiver muitos itens e passar de 1 página, continua com a
    // identidade visual completa em vez de ficar em branco).
    // =================================================================================
    private static class OrcamentoPageEvent extends PdfPageEventHelper {
        private final String numero;
        private final LocalDate dataCriacao;

        OrcamentoPageEvent(String numero, LocalDate dataCriacao) {
            this.numero = numero;
            this.dataCriacao = dataCriacao;
        }

        @Override
        public void onStartPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            float pageW = PageSize.A4.getWidth();
            float pageH = PageSize.A4.getHeight();
            desenharCabecalhoOrcamento(cb, pageW, pageH, HEADER_HEIGHT_PT, numero, dataCriacao);
        }
    }

    // ---------------------------------------------------------------
    // Cabeçalho: faixa escura com nome da empresa + faixa azul + título
    // ---------------------------------------------------------------
    private static void desenharCabecalhoOrcamento(
            PdfContentByte cb, float pageW, float pageH, float headerHeightPt,
            String numero, LocalDate dataCriacao
    ) {
        float topoFaixaEscura = pageH;
        float baseFaixaEscura = pageH - (headerHeightPt * 0.68f);

        // Faixa escura (nome empresa + contatos)
        cb.setColorFill(COR_NAVY);
        cb.rectangle(0, baseFaixaEscura, pageW, topoFaixaEscura - baseFaixaEscura);
        cb.fill();

        // Faixa azul fina (divisor)
        cb.setColorFill(COR_AZUL);
        cb.rectangle(0, baseFaixaEscura - 6f, pageW, 6f);
        cb.fill();

        desenharLogoComFundoBranco(cb, 20f, (topoFaixaEscura + baseFaixaEscura) / 2f, 30f);

        // Contatos à direita (telefone / endereço / CNPJ)
        Font fContato = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
        float xContato = pageW - 30f;
        float yContato = topoFaixaEscura - 16f;

        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase(EMPRESA_TELEFONE, fContato), xContato, yContato, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase(EMPRESA_ENDERECO_L1, fContato), xContato, yContato - 13f, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase(EMPRESA_ENDERECO_L2, fContato), xContato, yContato - 24f, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase("CNPJ: " + EMPRESA_CNPJ, fContato), xContato, yContato - 37f, 0);

        // ===== Título "ORÇAMENTO" + número + data =====
        float yTitulo = baseFaixaEscura - 22f;
        ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                new Phrase("ORÇAMENTO", new Font(Font.HELVETICA, 22, Font.BOLD, Color.BLACK)),
                28f, yTitulo, 0);

        ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                new Phrase("N° " + (numero != null ? numero : ""), new Font(Font.HELVETICA, 12, Font.BOLD, COR_AZUL)),
                28f, yTitulo - 16f, 0);

        String dataExtenso = formatarDataExtenso(dataCriacao);
        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
                new Phrase(EMPRESA_CIDADE + ", " + dataExtenso, new Font(Font.HELVETICA, 10, Font.BOLD, Color.BLACK)),
                pageW - 28f, yTitulo - 4f, 0);
    }

    // ---------------------------------------------------------------
    // Helpers de layout
    // ---------------------------------------------------------------
    private static void desenharCirculoComLetra(
            PdfContentByte cb, float cx, float cy, float raio,
            String letra, Color corFundo, Color corTexto, Font fonte
    ) {
        cb.setColorFill(corFundo);
        cb.circle(cx, cy, raio);
        cb.fill();

        Font f = new Font(fonte.getFamily(), fonte.getSize(), fonte.getStyle(), corTexto);
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase(letra, f), cx, cy - (fonte.getSize() / 3f), 0);
    }

    // ----- Logo real da empresa (carregado uma vez, cacheado) -----
    private static Image LOGO_IMAGEM;

    private static Image carregarLogo() {
        if (LOGO_IMAGEM == null) {
            try (InputStream is = PdfGenerator.class.getResourceAsStream("/logo-vdl.png")) {
                if (is == null) {
                    throw new RuntimeException("logo-vdl.png não encontrado em src/main/resources");
                }
                byte[] bytes = is.readAllBytes();
                LOGO_IMAGEM = Image.getInstance(bytes);
            } catch (Exception e) {
                throw new RuntimeException("Erro ao carregar o logo da empresa", e);
            }
        }
        return LOGO_IMAGEM;
    }

    // Desenha o logo dentro de um "selo" branco arredondado, com altura fixa em pt.
    // xLeftPt/yCenterPt: posição de ancoragem (canto esquerdo, centro vertical).
    private static void desenharLogoComFundoBranco(PdfContentByte cb, float xLeftPt, float yCenterPt, float alturaLogoPt) {
        Image logo = carregarLogo();
        float aspecto = logo.getWidth() / logo.getHeight();
        float larguraLogoPt = alturaLogoPt * aspecto;

        float paddingPt = alturaLogoPt * 0.28f;
        float larguraSeloPt = larguraLogoPt + paddingPt * 2;
        float alturaSeloPt = alturaLogoPt + paddingPt * 2;

        cb.setColorFill(Color.WHITE);
        cb.roundRectangle(xLeftPt, yCenterPt - alturaSeloPt / 2f, larguraSeloPt, alturaSeloPt, alturaSeloPt * 0.18f);
        cb.fill();

        try {
            logo.scaleToFit(larguraLogoPt, alturaLogoPt);
            logo.setAbsolutePosition(xLeftPt + paddingPt, yCenterPt - alturaLogoPt / 2f);
            cb.addImage(logo);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao desenhar o logo no PDF", e);
        }
    }

    private static PdfPTable criarBannerSecao(String texto) {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        PdfPCell c = new PdfPCell(new Phrase(texto, new Font(Font.HELVETICA, 11, Font.BOLD, Color.WHITE)));
        c.setBackgroundColor(COR_AZUL);
        c.setPadding(5f);
        c.setBorder(Rectangle.NO_BORDER);
        t.addCell(c);
        return t;
    }

    private static PdfPTable criarCartoesCliente(String cliente, String telefone) {
        PdfPTable t = new PdfPTable(5);
        t.setWidthPercentage(100);

        t.addCell(celulaCartao("CLIENTE", cliente));
        t.addCell(celulaCartao("CONTATO", telefone));
        t.addCell(celulaCartao("DEPARTAMENTO", "Compras"));
        t.addCell(celulaCartao("E-MAIL", "---"));
        t.addCell(celulaCartao("A/C", cliente));

        return t;
    }

    private static PdfPCell celulaCartao(String label, String valor) {
        PdfPCell c = new PdfPCell();
        c.setBackgroundColor(COR_CINZA_CLARO);
        c.setPadding(8f);
        c.setBorder(Rectangle.NO_BORDER);
        c.setBorderWidthLeft(2f);
        c.setBorderColorLeft(COR_AZUL);
        c.setBorder(Rectangle.LEFT);

        Paragraph p = new Paragraph();
        p.add(new Phrase(label + "\n", new Font(Font.HELVETICA, 7.5f, Font.BOLD, COR_CINZA_TEXTO)));
        p.add(new Phrase(valor != null && !valor.isBlank() ? valor : "---",
                new Font(Font.HELVETICA, 9.5f, Font.BOLD, Color.BLACK)));
        c.addElement(p);
        return c;
    }

    private static void estilizarCabecalho(PdfPCell c, Color cor) {
        c.setBackgroundColor(cor);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        c.setPadding(6f);
        c.setBorderColor(Color.WHITE);
        c.setBorderWidth(0.6f);
    }

    private static PdfPCell celulaHeaderSub(String texto, Font f) {
        PdfPCell c = new PdfPCell(new Phrase(texto, f));
        c.setBackgroundColor(COR_AZUL);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        c.setPadding(5f);
        c.setBorderColor(Color.WHITE);
        c.setBorderWidth(0.6f);
        return c;
    }

    private static PdfPCell celulaCorpo(String texto, Font f, Color bg, int alinhamento, boolean negrito) {
        Font fonte = negrito ? new Font(Font.HELVETICA, f.getSize(), Font.BOLD, Color.BLACK) : f;
        PdfPCell c = new PdfPCell(new Phrase(texto, fonte));
        c.setBackgroundColor(bg);
        c.setHorizontalAlignment(alinhamento);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        c.setPadding(5f);
        c.setBorderColor(new Color(225, 228, 233));
        return c;
    }

    private static PdfPTable criarItemCondicao(String letra, String titulo, String descricao) {
        PdfPTable linha = new PdfPTable(new float[]{1f, 14f});
        linha.setWidthPercentage(100);
        linha.setSpacingAfter(3f);

        PdfPCell cIcone = new PdfPCell(new Phrase(letra, new Font(Font.HELVETICA, 8, Font.BOLD, Color.WHITE)));
        cIcone.setBorder(Rectangle.NO_BORDER);
        cIcone.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cIcone.setHorizontalAlignment(Element.ALIGN_CENTER);
        cIcone.setBackgroundColor(COR_AZUL);
        cIcone.setPadding(4f);
        linha.addCell(cIcone);

        PdfPCell cTexto = new PdfPCell();
        cTexto.setBorder(Rectangle.NO_BORDER);
        cTexto.setPadding(2f);
        Paragraph pTexto = new Paragraph();
        pTexto.add(new Phrase(titulo + ": ", new Font(Font.HELVETICA, 8.5f, Font.BOLD, Color.BLACK)));
        pTexto.add(new Phrase(descricao, new Font(Font.HELVETICA, 8.5f, Font.NORMAL, new Color(70, 76, 86))));
        cTexto.addElement(pTexto);
        linha.addCell(cTexto);

        return linha;
    }

    private static PdfPCell celulaPersonalizacao(boolean personalizada, Color bg) {
        Color corTexto = personalizada ? new Color(27, 130, 70) : COR_CINZA_TEXTO;
        String texto = personalizada ? "Sim" : "Não";

        PdfPCell c = new PdfPCell(new Phrase(texto, new Font(Font.HELVETICA, 9.5f, Font.BOLD, corTexto)));
        c.setBackgroundColor(bg);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setVerticalAlignment(Element.ALIGN_MIDDLE);
        c.setPadding(5f);
        c.setBorderColor(new Color(225, 228, 233));
        return c;
    }

    private static PdfPTable criarFaixaPersonalizacao(String coresPdf) {
        String coresFormatadas = coresPdf.replace(",", " /").trim();

        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);

        PdfPCell c = new PdfPCell();
        c.setBackgroundColor(COR_AZUL_CLARO);
        c.setBorder(Rectangle.LEFT);
        c.setBorderWidthLeft(3f);
        c.setBorderColorLeft(COR_AZUL);
        c.setPadding(6f);

        Paragraph p = new Paragraph();
        p.add(new Phrase("PERSONALIZAÇÃO ATIVA — ", new Font(Font.HELVETICA, 9f, Font.BOLD, COR_AZUL)));
        p.add(new Phrase("Cores: " + coresFormatadas, new Font(Font.HELVETICA, 9f, Font.BOLD, Color.BLACK)));
        c.addElement(p);
        t.addCell(c);

        return t;
    }

    private static String formatarDataExtenso(LocalDate data) {
        if (data == null) return "";
        String[] meses = {
                "janeiro", "fevereiro", "março", "abril", "maio", "junho",
                "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
        };
        String mes = meses[data.getMonthValue() - 1];
        mes = mes.substring(0, 1).toUpperCase() + mes.substring(1);
        return data.getDayOfMonth() + " de " + mes + " de " + data.getYear();
    }

    // =================================================================================
    // HELPERS GENÉRICOS — reaproveitados por Pedido de Compra, Ordem de Serviço
    // e Ordem de Entrega, pra manter o mesmo padrão visual do Orçamento.
    // =================================================================================

    // Cabeçalho genérico (mesmo estilo do orçamento, mas com título/código configuráveis)
    private static void desenharCabecalhoDocumento(
            PdfContentByte cb, float pageW, float pageH, float headerHeightPt,
            String tituloDoc, String codigo, LocalDate data
    ) {
        float topoFaixaEscura = pageH;
        float baseFaixaEscura = pageH - (headerHeightPt * 0.68f);

        cb.setColorFill(COR_NAVY);
        cb.rectangle(0, baseFaixaEscura, pageW, topoFaixaEscura - baseFaixaEscura);
        cb.fill();

        cb.setColorFill(COR_AZUL);
        cb.rectangle(0, baseFaixaEscura - 6f, pageW, 6f);
        cb.fill();

        desenharLogoComFundoBranco(cb, 20f, (topoFaixaEscura + baseFaixaEscura) / 2f, 30f);

        Font fContato = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
        float xContato = pageW - 30f;
        float yContato = topoFaixaEscura - 16f;

        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase(EMPRESA_TELEFONE, fContato), xContato, yContato, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase(EMPRESA_ENDERECO_L1, fContato), xContato, yContato - 13f, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase(EMPRESA_ENDERECO_L2, fContato), xContato, yContato - 24f, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase("CNPJ: " + EMPRESA_CNPJ, fContato), xContato, yContato - 37f, 0);

        float yTitulo = baseFaixaEscura - 22f;
        ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                new Phrase(tituloDoc, new Font(Font.HELVETICA, 20, Font.BOLD, Color.BLACK)),
                28f, yTitulo, 0);

        ColumnText.showTextAligned(cb, Element.ALIGN_LEFT,
                new Phrase("N° " + (codigo != null ? codigo : ""), new Font(Font.HELVETICA, 12, Font.BOLD, COR_AZUL)),
                28f, yTitulo - 16f, 0);

        String dataExtenso = formatarDataExtenso(data);
        ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
                new Phrase(EMPRESA_CIDADE + ", " + dataExtenso, new Font(Font.HELVETICA, 10, Font.BOLD, Color.BLACK)),
                pageW - 28f, yTitulo - 4f, 0);
    }

    // Evento de página genérico: repete o cabeçalho em todas as páginas
    private static class DocumentoPageEvent extends PdfPageEventHelper {
        private final String tituloDoc;
        private final String codigo;
        private final LocalDate data;

        DocumentoPageEvent(String tituloDoc, String codigo, LocalDate data) {
            this.tituloDoc = tituloDoc;
            this.codigo = codigo;
            this.data = data;
        }

        @Override
        public void onStartPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            float pageW = PageSize.A4.getWidth();
            float pageH = PageSize.A4.getHeight();
            desenharCabecalhoDocumento(cb, pageW, pageH, HEADER_HEIGHT_PT, tituloDoc, codigo, data);
        }
    }

    // Linha de cartões flexível: cada par é {label, valor}. Reaproveita celulaCartao.
    @SafeVarargs
    private static PdfPTable criarCartoesGenerico(String[]... pares) {
        PdfPTable t = new PdfPTable(pares.length);
        t.setWidthPercentage(100);
        for (String[] par : pares) {
            t.addCell(celulaCartao(par[0], par[1]));
        }
        return t;
    }

    // Linha "TOTAL GERAL" destacada, reaproveitável nas tabelas de itens
    private static void adicionarLinhaTotalGeral(PdfPTable tabela, int colspanLabel, String valorFormatado) {
        Font fTotal = new Font(Font.HELVETICA, 10, Font.BOLD, Color.BLACK);

        PdfPCell cLabel = new PdfPCell(new Phrase("TOTAL GERAL", fTotal));
        cLabel.setColspan(colspanLabel);
        cLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cLabel.setBackgroundColor(COR_AZUL_CLARO);
        cLabel.setPadding(7f);
        cLabel.setBorderColor(new Color(200, 215, 235));
        tabela.addCell(cLabel);

        PdfPCell cValor = new PdfPCell(new Phrase(valorFormatado, fTotal));
        cValor.setHorizontalAlignment(Element.ALIGN_CENTER);
        cValor.setBackgroundColor(COR_AZUL_CLARO);
        cValor.setPadding(7f);
        cValor.setBorderColor(new Color(200, 215, 235));
        tabela.addCell(cValor);
    }

    public static ByteArrayInputStream gerarOrdemCompraPdf(OrdemCompraPdfDTO dto, int diasUteis, String coresPdf) {

        Document document = new Document(PageSize.A4, 28f, 28f, HEADER_HEIGHT_PT + 14f, 24f);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new DocumentoPageEvent("PEDIDO DE COMPRA", dto.codigo(), dto.data()));
            document.open();

            Font normal = new Font(Font.HELVETICA, 9.5f, Font.NORMAL, Color.BLACK);
            Font header = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);

            // --- Banner "DADOS DO CLIENTE" ---
            document.add(criarBannerSecao("DADOS DO CLIENTE"));
            document.add(new Paragraph(" ", new Font(Font.HELVETICA, 4)));

            document.add(criarCartoesGenerico(
                    new String[]{"CLIENTE", dto.nomeCliente()},
                    new String[]{"TELEFONE", dto.telefone()},
                    new String[]{"CPF/CNPJ", dto.cpfCnpj()},
                    new String[]{"E-MAIL", dto.email()}
            ));
            document.add(new Paragraph(" ", new Font(Font.HELVETICA, 3)));
            document.add(criarCartoesGenerico(
                    new String[]{"INSCRIÇÃO ESTADUAL", dto.inscricaoMunicipal()},
                    new String[]{"ENDEREÇO", dto.rua() + " - " + dto.bairro() + " - " + dto.municipio() + " - CEP " + dto.cep()}
            ));
            document.add(Chunk.NEWLINE);

            // --- Tabela de itens ---
            PdfPTable tabela = new PdfPTable(7);
            tabela.setWidthPercentage(100);
            tabela.setSpacingBefore(6f);
            tabela.setWidths(new float[]{1.3f, 0.9f, 0.9f, 0.9f, 1.6f, 1.4f, 1.4f});

            PdfPCell cQuantidade = new PdfPCell(new Phrase("QUANTIDADE", header));
            estilizarCabecalho(cQuantidade, COR_AZUL);
            tabela.addCell(cQuantidade);

            PdfPCell cLar = new PdfPCell(new Phrase("LAR", header));
            estilizarCabecalho(cLar, COR_AZUL);
            tabela.addCell(cLar);

            PdfPCell cAlt = new PdfPCell(new Phrase("ALT", header));
            estilizarCabecalho(cAlt, COR_AZUL);
            tabela.addCell(cAlt);

            PdfPCell cCom = new PdfPCell(new Phrase("COM", header));
            estilizarCabecalho(cCom, COR_AZUL);
            tabela.addCell(cCom);

            PdfPCell cGramatura = new PdfPCell(new Phrase("GRAMATURA", header));
            estilizarCabecalho(cGramatura, COR_AZUL);
            tabela.addCell(cGramatura);

            PdfPCell cValorUnit = new PdfPCell(new Phrase("VALOR POR UNIDADE", header));
            estilizarCabecalho(cValorUnit, COR_AZUL);
            tabela.addCell(cValorUnit);

            PdfPCell cTotal = new PdfPCell(new Phrase("TOTAL", header));
            estilizarCabecalho(cTotal, COR_AZUL);
            tabela.addCell(cTotal);

            int i = 1;
            for (var item : dto.itens()) {
                OrcamentoItens ocrIt = item.getOrcamentoItens();
                boolean zebra = (i % 2 == 0);
                Color bg = zebra ? COR_CINZA_CLARO : Color.WHITE;

                tabela.addCell(celulaCorpo(item.getQuantidade() + "", normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(ocrIt.getLargura().intValue() + "", normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(ocrIt.getAltura().intValue() + "", normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(ocrIt.getComprimento().intValue() + "", normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(
                        ocrIt.getGramatura().getNumeroGramatura().intValue() + "/" + ocrIt.getGramatura().getDescGramatura(),
                        normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(formatar(item.getPrecoUnitario()), normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(formatar(item.getValorTotal()), normal, bg, Element.ALIGN_CENTER, false));
                i++;
            }

            adicionarLinhaTotalGeral(tabela, 6, formatar(dto.valorTotalProduto()));

            document.add(tabela);
            document.add(Chunk.NEWLINE);

            // --- Banner "CONDIÇÕES DO PEDIDO" ---
            document.add(criarBannerSecao("CONDIÇÕES DO PEDIDO"));
            document.add(new Paragraph(" ", new Font(Font.HELVETICA, 3)));

            document.add(criarItemCondicao("P", "PRAZO DE ENTREGA", diasUteis + " dias úteis."));
            document.add(criarItemCondicao("$", "FORMA DE PAGAMENTO", dto.formaPagamento()));
            document.add(criarItemCondicao("F", "FRETE", "Por conta do cliente."));
            document.add(criarItemCondicao("C", "COR/PERSONALIZAÇÃO",
                    coresPdf != null && !coresPdf.isBlank() ? coresPdf : "Sem personalização"));
            document.add(criarItemCondicao("I", "OBSERVAÇÕES",
                    "Preço final, sem acréscimo de ICMS/IPI. Considerando nossas características de produção, o pedido poderá ser atendido com até 10% de variação na quantidade solicitada."));

            document.close();

        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    // ===========================
    // ORDEM DE SERVIÇO
    public static ByteArrayInputStream gerarOrdemServicoPdf(List<OrdemServico> lista, OrdemServicoServices oss) {

        if (lista == null || lista.isEmpty()) {
            throw new OrdemServicoNaoEncontradaException("Nenhuma ordem de serviço encontrada para gerar o PDF.");
        }

        Document document = new Document(PageSize.A4, 36, 36, 36, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            final float MM = 2.83465f; // mm -> pt
            final float pageWmm = 210f;

            boolean first = true;

            for (OrdemServico os : lista) {

                if (!first) document.newPage();
                first = false;

                PdfContentByte cb = writer.getDirectContent();
                cb.reset();

                OrcamentoItens it = os.getOrdemCompraItem().getOrcamentoItens();

                // =========================
                // FAIXA DE CABEÇALHO (empresa) — nova, mesmo padrão visual dos outros PDFs
                // =========================
                float headerTopoMm = 297f;
                float headerAlturaMm = 22f;
                float headerBaseMm = headerTopoMm - headerAlturaMm;

                cb.setColorFill(COR_NAVY);
                cb.rectangle(0, headerBaseMm * MM, pageWmm * MM, headerAlturaMm * MM);
                cb.fill();

                cb.setColorFill(COR_AZUL);
                cb.rectangle(0, (headerBaseMm - 1.5f) * MM, pageWmm * MM, 1.5f * MM);
                cb.fill();

                desenharLogoComFundoBranco(cb, 8f * MM, (headerBaseMm + headerAlturaMm / 2f) * MM, 14f * MM);

                ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT,
                        new Phrase(EMPRESA_TELEFONE, new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE)),
                        (pageWmm - 12f) * MM, (headerBaseMm + headerAlturaMm / 2f + 1f) * MM, 0);

                cb.setColorFill(Color.BLACK);

                // =========================
                // FONTES (mais “premium”)
                // =========================
                Font title = new Font(Font.HELVETICA, 18, Font.BOLD);
                Font sub = new Font(Font.HELVETICA, 11, Font.NORMAL);
                Font bold = new Font(Font.HELVETICA, 11, Font.BOLD);
                Font bar = new Font(Font.HELVETICA, 10, Font.BOLD);

                // =========================
                // CABEÇALHO DO CONTEÚDO (título + código) — deslocado pra baixo da faixa
                // =========================
                float yTopTitle = 267f;
                ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
                        new Phrase("ORDEM DE SERVIÇO", title),
                        (pageWmm / 2f) * MM, yTopTitle * MM, 0);

                ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
                        new Phrase(os.getCodigo() + " / " + String.format("%02d", os.getSequencial()), sub),
                        (pageWmm / 2f) * MM, (yTopTitle - 8f) * MM, 0);

                // linha separadora
                cb.setLineWidth(1.0f);
                cb.moveTo(12f * MM, 250f * MM);
                cb.lineTo(198f * MM, 250f * MM);
                cb.stroke();

                // =========================
                // BLOCO DE INFO (mais espaçado)
                // =========================
                float xInfo = 14f;
                float yInfo = 242f;

                drawLabelValue(cb, bold, sub, "Nome:", os.getOrdemCompra().getCliente().getNomeCliente(), xInfo, yInfo);
                yInfo -= 7f;
                drawLabelValue(cb, bold, sub, "Data Criação:", formatarData(os.getDataCriacao()), xInfo, yInfo);
                yInfo -= 7f;
                drawLabelValue(cb, bold, sub, "Prazo Máximo:", formatarData(os.getPrazoMaximoEntrega()), xInfo, yInfo);
                yInfo -= 7f;
                drawLabelValue(cb, bold, sub, "Quantidade:", String.valueOf(os.getQuantidade()), xInfo, yInfo);
                yInfo -= 7f;
                drawLabelValue(cb, bold, sub, "Gramatura:",
                        it.getGramatura().getNumeroGramatura() + " / " + it.getGramatura().getDescGramatura(),
                        xInfo, yInfo);
                yInfo -= 7f;
                drawLabelValue(cb, bold, sub, "Personalização:", oss.getDescricaoPersonalizacao(it), xInfo, yInfo);

                // =========================
                // FAIXA (arredondada + central)
                // =========================
                float gapAposGramaturaMm = 24f;
                float barTopY = yInfo - gapAposGramaturaMm;

                cb.setLineWidth(1.2f);
                cb.roundRectangle(12f * MM, barTopY * MM, 186f * MM, 10f * MM, 2.3f * MM);
                cb.stroke();

                ColumnText.showTextAligned(cb, Element.ALIGN_CENTER,
                        new Phrase("DIVISÃO VINCO E CORTE (Medidas em mm )", bar),
                        (pageWmm / 2f) * MM, (barTopY + 3.0f) * MM, 0);

                // =========================
                // ÁREA DO DESENHO (com moldura leve)
                // =========================
                float leftMm = 12f;
                float rightMm = 12f;

                float rodapeReservaMm = 42f;
                float bottomMm = 10f;

                float originXmm = leftMm;
                float originYmm = bottomMm + rodapeReservaMm;

                float maxWmm = pageWmm - leftMm - rightMm;

                float topLimitMm = barTopY - 6f;
                float maxHmm = topLimitMm - originYmm;
                if (maxHmm < 60f) maxHmm = 60f;

                // moldura (bem sutil)
                cb.setLineWidth(0.8f);
                cb.rectangle(leftMm * MM, (originYmm - 2f) * MM, (pageWmm - leftMm - rightMm) * MM, (maxHmm + 4f) * MM);
                cb.stroke();

                // desenho
                BoxDieDrawer.drawIllustration(cb, it, originXmm, originYmm, maxWmm, maxHmm);

                // =========================
                // RODAPÉ MEDIDAS (igual você já tinha)
                // =========================
                desenharRodapeMedidas(cb, pageWmm, MM, it);
            }

            document.close();

        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    // helper: desenha "Label: valor" alinhado
    private static void drawLabelValue(PdfContentByte cb, Font bold, Font normal, String label, String value, float xMm, float yMm) {
        ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, new Phrase(label + " ", bold), xMm * 2.83465f, yMm * 2.83465f, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, new Phrase(value == null ? "" : value, normal), (xMm + 28f) * 2.83465f, yMm * 2.83465f, 0);
    }

    // =================================================================================
    // RODAPÉ FIXO: títulos + medida grande (sem os 3 números pequenos)
    // =================================================================================
    private static void desenharRodapeMedidas(
            PdfContentByte cb,
            float pageWmm,
            float MM,
            OrcamentoItens it
    ) {
        float rodapeBottomMm = 8f;   // distância do chão
        float rodapeHeightMm = 32f;  // altura total do rodapé
        float leftMm = 12f;
        float rightMm = 12f;

        float wMm = pageWmm - leftMm - rightMm;

        float yBaseMm = rodapeBottomMm;
        float yTopMm = yBaseMm + rodapeHeightMm;

        // =========================
        // MEDIDA GRANDE (C x L x A)
        // =========================
        int cVal = it.getComprimento().intValue();
        int lVal = it.getLargura().intValue();
        int aVal = it.getAltura().intValue();

        String cStr = String.valueOf(cVal);
        String lStr = String.valueOf(lVal);
        String aStr = String.valueOf(aVal);

        Font labelBig = new Font(Font.HELVETICA, 10, Font.BOLD);
        Font bigFont = new Font(Font.HELVETICA, 34, Font.BOLD);
        Font xFont = new Font(Font.HELVETICA, 26, Font.BOLD);

        // BaseFont real (SEM createFont)
        BaseFont bfBig = bigFont.getCalculatedBaseFont(false);
        BaseFont bfX = xFont.getCalculatedBaseFont(false);

        // larguras reais em pontos
        float wC = bfBig.getWidthPoint(cStr, bigFont.getSize());
        float wL = bfBig.getWidthPoint(lStr, bigFont.getSize());
        float wA = bfBig.getWidthPoint(aStr, bigFont.getSize());
        float wX = bfX.getWidthPoint("x", xFont.getSize());

        float totalW = wC + wX + wL + wX + wA;

        float centerXpt = (pageWmm / 2f) * MM;
        float startXpt = centerXpt - (totalW / 2f);

        // centros de cada elemento
        float cCenter = startXpt + (wC / 2f);
        float x1Center = startXpt + wC + (wX / 2f);
        float lCenter = startXpt + wC + wX + (wL / 2f);
        float x2Center = startXpt + wC + wX + wL + (wX / 2f);
        float aCenter = startXpt + wC + wX + wL + wX + (wA / 2f);

        // posições verticais
        float yBigPt = (yBaseMm + 8.5f) * MM;      // números grandes
        float yLabelBigPt = (yBaseMm + 18.5f) * MM;     // labels acima (ajuste fino aqui)

        // labels exatamente em cima de cada número grande
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase("Comprimento", labelBig), cCenter, yLabelBigPt, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase("Largura", labelBig), lCenter, yLabelBigPt, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase("Altura", labelBig), aCenter, yLabelBigPt, 0);

        // números grandes + "x"
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase(cStr, bigFont), cCenter, yBigPt, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase("x", xFont), x1Center, yBigPt, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase(lStr, bigFont), lCenter, yBigPt, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase("x", xFont), x2Center, yBigPt, 0);
        ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, new Phrase(aStr, bigFont), aCenter, yBigPt, 0);
    }

    public static ByteArrayInputStream gerarOrdemEntregaPdf(OrdemEntregaPdfDTO dto) {
        Document document = new Document(PageSize.A4, 28f, 28f, HEADER_HEIGHT_PT + 14f, 24f);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new DocumentoPageEvent("ORDEM DE ENTREGA", dto.codigo(), dto.dataEntrega()));
            document.open();

            Font normal = new Font(Font.HELVETICA, 9.5f, Font.NORMAL, Color.BLACK);
            Font header = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);

            // --- Banner "DADOS DO CLIENTE" ---
            document.add(criarBannerSecao("DADOS DO CLIENTE"));
            document.add(new Paragraph(" ", new Font(Font.HELVETICA, 4)));

            document.add(criarCartoesGenerico(
                    new String[]{"CLIENTE", dto.nomeCliente()},
                    new String[]{"CPF/CNPJ", dto.cpfCnpj()},
                    new String[]{"TELEFONE", dto.telefone()},
                    new String[]{"E-MAIL", dto.email()}
            ));
            document.add(new Paragraph(" ", new Font(Font.HELVETICA, 3)));
            document.add(criarCartoesGenerico(
                    new String[]{"ENDEREÇO", dto.endereco()}
            ));
            document.add(Chunk.NEWLINE);

            // --- Tabela de itens ---
            PdfPTable tabela = new PdfPTable(7);
            tabela.setWidthPercentage(100);
            tabela.setSpacingBefore(6f);
            tabela.setWidths(new float[]{1f, 0.9f, 0.9f, 0.9f, 1.6f, 1.4f, 1.4f});

            PdfPCell cQtd = new PdfPCell(new Phrase("QTD", header));
            estilizarCabecalho(cQtd, COR_AZUL);
            tabela.addCell(cQtd);

            PdfPCell cLar = new PdfPCell(new Phrase("LAR", header));
            estilizarCabecalho(cLar, COR_AZUL);
            tabela.addCell(cLar);

            PdfPCell cAlt = new PdfPCell(new Phrase("ALT", header));
            estilizarCabecalho(cAlt, COR_AZUL);
            tabela.addCell(cAlt);

            PdfPCell cCom = new PdfPCell(new Phrase("COM", header));
            estilizarCabecalho(cCom, COR_AZUL);
            tabela.addCell(cCom);

            PdfPCell cGramatura = new PdfPCell(new Phrase("GRAMATURA", header));
            estilizarCabecalho(cGramatura, COR_AZUL);
            tabela.addCell(cGramatura);

            PdfPCell cValorUnd = new PdfPCell(new Phrase("VALOR UND", header));
            estilizarCabecalho(cValorUnd, COR_AZUL);
            tabela.addCell(cValorUnd);

            PdfPCell cTotal = new PdfPCell(new Phrase("TOTAL", header));
            estilizarCabecalho(cTotal, COR_AZUL);
            tabela.addCell(cTotal);

            BigDecimal valorTotalGeral = BigDecimal.ZERO;

            int i = 1;
            for (var item : dto.itens()) {
                BigDecimal valorTotalItem = BigDecimal.ZERO;
                if (item.getValorTotal() != null) {
                    valorTotalItem = item.getValorTotal();
                } else if (item.getQuantidade() != null && item.getPrecoUnitario() != null) {
                    valorTotalItem = item.getPrecoUnitario().multiply(new BigDecimal(item.getQuantidade()));
                }
                valorTotalGeral = valorTotalGeral.add(valorTotalItem);

                boolean zebra = (i % 2 == 0);
                Color bg = zebra ? COR_CINZA_CLARO : Color.WHITE;

                tabela.addCell(celulaCorpo(item.getQuantidade().toString(), normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(item.getLargura().intValue() + "", normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(item.getAltura().intValue() + "", normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(item.getComprimento().intValue() + "", normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(
                        item.getNumeroGramatura() + " / " + item.getDescricaoGramatura(), normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(formatar(item.getPrecoUnitario()), normal, bg, Element.ALIGN_CENTER, false));
                tabela.addCell(celulaCorpo(formatar(valorTotalItem), normal, bg, Element.ALIGN_CENTER, false));
                i++;
            }

            // Renderiza TOTAL GERAL somente se houver 2 ou mais itens (igual antes)
            if (dto.itens() != null && dto.itens().size() > 1) {
                adicionarLinhaTotalGeral(tabela, 6, formatar(valorTotalGeral));
            }

            document.add(tabela);

            // --- Rodapé de assinaturas (mantido exatamente igual, posição fixa) ---
            PdfContentByte cb = writer.getDirectContent();

            float yLinha = 60f;
            float larguraLinha = 200f;

            cb.moveTo(60f, yLinha);
            cb.lineTo(60f + larguraLinha, yLinha);
            cb.stroke();

            cb.moveTo(PageSize.A4.getWidth() - 60f - larguraLinha, yLinha);
            cb.lineTo(PageSize.A4.getWidth() - 60f, yLinha);
            cb.stroke();

            ColumnText.showTextAligned(
                    cb,
                    Element.ALIGN_CENTER,
                    new Phrase("Assinatura", new Font(Font.HELVETICA, 9)),
                    60f + larguraLinha / 2,
                    yLinha - 12f,
                    0
            );

            ColumnText.showTextAligned(
                    cb,
                    Element.ALIGN_CENTER,
                    new Phrase("Documento", new Font(Font.HELVETICA, 9)),
                    PageSize.A4.getWidth() - 60f - larguraLinha / 2,
                    yLinha - 12f,
                    0
            );

            document.close();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
        return new ByteArrayInputStream(out.toByteArray());
    }

    private static PdfPCell criarCelula(String texto, Font fonte) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, fonte));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(8);
        return cell;
    }

    private static PdfPCell criarCelulaInfo(String texto, Font fonte) {
        PdfPCell cell = new PdfPCell(new Phrase(texto, fonte));
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        return cell;
    }

    private static String formatar(BigDecimal valor) {
        if (valor == null) return "0,00";
        NumberFormat nf = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
        return nf.format(valor);
    }

    private static String formatarData(LocalDate data) {
        if (data == null) return "";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return data.format(formatter);
    }
}