package com.vdl.system.services;

import com.vdl.system.domain.dto.ordemCompra.CriarOrdemCompraRequestDTO;
import com.vdl.system.domain.dto.pdf.OrdemCompraPdfDTO;
import com.vdl.system.domain.enumered.StatusOrcamento;
import com.vdl.system.domain.enumered.StatusOrdemCompra;
import com.vdl.system.domain.model.*;
import com.vdl.system.domain.repository.CaixaRepository;
import com.vdl.system.domain.repository.OrcamentoRepository;
import com.vdl.system.domain.repository.OrdemCompraRepository;
import com.vdl.system.infra.exception.cliente.ClienteNaoEncontradoException;
import com.vdl.system.infra.exception.orcamento.OrcamentoNaoAprovadoException;
import com.vdl.system.infra.exception.orcamento.OrcamentoSemClienteVinculadoException;
import com.vdl.system.infra.exception.ordemCompra.OrdemCompraNaoEncontradoException;
import com.vdl.system.infra.exception.ordemCompraItens.OrdemCompraItemNaoPertenceAoOrcamentoException;
import com.vdl.system.infra.exception.ordemCompraItens.OrdemCompraItemQuantidadeInvalidaException;
import com.vdl.system.pdf.PdfGenerator;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class OrdemCompraServices {

    private final OrdemCompraRepository ordemCompraRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final CaixaRepository caixaRepository;
    private final PrazoEntregaService prazoEntregaService;

    public OrdemCompraServices(OrdemCompraRepository ordemCompraRepository, OrcamentoRepository orcamentoRepository, CaixaRepository caixaRepository, PrazoEntregaService prazoEntregaService) {
        this.ordemCompraRepository = ordemCompraRepository;
        this.orcamentoRepository = orcamentoRepository;
        this.caixaRepository = caixaRepository;
        this.prazoEntregaService = prazoEntregaService;
    }

    @Transactional
    public OrdemCompra criarOrdemCompra(Long orcamentoId, CriarOrdemCompraRequestDTO dto) {
        Orcamento orcamento = orcamentoRepository.findById(orcamentoId)
                .orElseThrow(() -> new ClienteNaoEncontradoException("Orçamento com id: " + orcamentoId + " não encontrado"));

        if (orcamento.isOrdemCompraCriada()) {
            throw new IllegalStateException("Uma ordem de compra já foi gerada para este orçamento!");
        }

        if (!orcamento.getStatus().equals(StatusOrcamento.APROVADO)) {
            throw new OrcamentoNaoAprovadoException("Orçamento precisa está aprovado!");
        }

        if (orcamento.getCliente() == null) {
            throw new OrcamentoSemClienteVinculadoException("Precisa ter um cliente vinculado ao orçamento!");
        }

        String codigoOcr = orcamento.getCodigo();
        String numero = codigoOcr.replaceAll("\\D+", "");
        String codigoOc = "OC-" + numero;

        OrdemCompra ordemCompra = new OrdemCompra();

        ordemCompra.setCodigo(codigoOc);
        ordemCompra.setDataCriacao(LocalDate.now());
        ordemCompra.setOrcamento(orcamento);
        ordemCompra.setCliente(orcamento.getCliente());
        ordemCompra.setFormaPagamento(dto.formaPagamento());
        ordemCompra.setStatus(StatusOrdemCompra.PENDENTE);

        BigDecimal valorTotalProduto = BigDecimal.ZERO;

        for (var itemReq : dto.itens()) {

            if (itemReq.quantidade() == null || itemReq.quantidade() <= 0) {
                throw new OrdemCompraItemQuantidadeInvalidaException("Quantidade inválida, tem que ser maior que 0");
            }

            OrcamentoItens itemOrcamento = orcamento.getItens().stream()
                    .filter(i -> i.getId().equals(itemReq.orcamentoItemId()))
                    .findFirst()
                    .orElseThrow(() -> new OrdemCompraItemNaoPertenceAoOrcamentoException("Item não pertence a este orçamento"));

            BigDecimal precoUnitario = arred2(calcularPrecoUnitario(itemOrcamento, itemReq.quantidade()));
            BigDecimal total = precoUnitario.multiply(BigDecimal.valueOf(itemReq.quantidade()))
                    .setScale(2, RoundingMode.HALF_UP);

            valorTotalProduto = valorTotalProduto.add(total);

            OrdemCompraItem item = new OrdemCompraItem();
            item.setOrdemCompra(ordemCompra);
            item.setOrcamentoItens(itemOrcamento);
            item.setQuantidade(itemReq.quantidade());
            item.setPrecoUnitario(precoUnitario);
            item.setValorTotal(total);

            ordemCompra.getItens().add(item);
        }

        ordemCompra.setValorTotalProduto(valorTotalProduto);

        orcamento.setOrdemCompraCriada(true);
        orcamento.setStatus(StatusOrcamento.FINALIZADO);
        orcamentoRepository.save(orcamento);

        return ordemCompraRepository.save(ordemCompra);
    }

    @Transactional
    public OrdemCompra aprovarOrdemCompra(Long id) {

        OrdemCompra ordemCompra = ordemCompraRepository.findById(id)
                .orElseThrow(() -> new OrdemCompraNaoEncontradoException("Ordem de compra id: " + id + " não encontrado!"));

        for (OrdemCompraItem item : ordemCompra.getItens()) {

            OrcamentoItens orcItem = item.getOrcamentoItens();

            Caixa caixa = new Caixa();

            caixa.setTipoCaixa(orcItem.getTipoCaixa());
            caixa.setComprimento(orcItem.getComprimento());
            caixa.setLargura(orcItem.getLargura());
            caixa.setAltura(orcItem.getAltura());
            caixa.setPersonalizada(orcItem.getPersonalizada());
            caixa.setTipoPapelao(orcItem.getTipoPapelao());
            caixa.setGramatura(orcItem.getGramatura());
            caixa.setQuantidade(item.getQuantidade());

            caixa.setCliente(item.getOrdemCompra().getCliente());
            caixa.setOrdemCompraItem(item);

            caixaRepository.save(caixa);
        }

        // MARCA COMO FINALIZADO APÓS ENVIAR PARA PRODUÇÃO/SERVIÇO
        ordemCompra.setStatus(StatusOrdemCompra.FINALIZADO);

        return ordemCompraRepository.save(ordemCompra);
    }

    private BigDecimal calcularPrecoUnitario(OrcamentoItens dto, int qtd) {
        if (qtd <= 300) return dto.getValorQtdPequena();
        if (qtd <= 800) return dto.getValorQtdMedia();
        return dto.getValorQtdGrande();
    }

    public ByteArrayInputStream gerarPdf(Long id) {
        log.info("Gerar pdf ordem de compra com o id: {}", id);

        var ordemCompra = ordemCompraRepository.findById(id).orElseThrow(() -> new OrdemCompraNaoEncontradoException("Ordem de compra não encontrado!"));
        log.info("Pdf gerado com sucesso!");

        int diasUteis = prazoEntregaService.calcularPrazoDiasUteis(ordemCompra.getOrcamento().getItens());

        String coresPdf = "Sem Personalização";

        if (ordemCompra.getOrcamento().getPersonalizacao() != null &&
                ordemCompra.getOrcamento().getPersonalizacao().getAtiva() != null) {

            coresPdf = ordemCompra.getOrcamento()
                    .getPersonalizacao()
                    .getCores()
                    .stream()
                    .map(Enum::name)
                    .collect(Collectors.joining(" | "));
        }

        OrdemCompraPdfDTO pdfDTO = new OrdemCompraPdfDTO(
                ordemCompra.getCodigo(),
                ordemCompra.getCliente().getNomeCliente(),
                ordemCompra.getCliente().getCpfCnpj(),
                ordemCompra.getCliente().getInscricaoMunicipal(),
                ordemCompra.getCliente().getEndereco().getRua(),
                ordemCompra.getCliente().getEndereco().getBairro(),
                ordemCompra.getCliente().getEndereco().getCep(),
                ordemCompra.getCliente().getEndereco().getMunicipio(),
                ordemCompra.getCliente().getTelefone(),
                ordemCompra.getCliente().getEmail(),
                ordemCompra.getDataCriacao(),
                ordemCompra.getFormaPagamento(),
                ordemCompra.getItens(),
                ordemCompra.getValorTotalProduto()
        );

        return PdfGenerator.gerarOrdemCompraPdf(pdfDTO, diasUteis, coresPdf);
    }

    private BigDecimal arred2(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }

    public List<OrdemCompra> listarTodas(StatusOrdemCompra status) {
        if (status != null) {
            return ordemCompraRepository.findByStatus(status);
        }
        return ordemCompraRepository.findAll();
    }

    public OrdemCompra buscarPorId(Long id) {
        return ordemCompraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Id não encontrado"));
    }
}