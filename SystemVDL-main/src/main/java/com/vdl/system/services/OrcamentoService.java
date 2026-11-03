package com.vdl.system.services;

import com.vdl.system.domain.dto.cliente.ClienteRequestDTO;
import com.vdl.system.domain.dto.orcamento.CriarOrcamentoRequestDTO;
import com.vdl.system.domain.dto.orcamento.OrcamentoResponseDTO;
import com.vdl.system.domain.dto.orcamentoItens.CriarOrcamentoItensResponseDTO;
import com.vdl.system.domain.enumered.StatusOrcamento;
import com.vdl.system.domain.mapper.OrcamentoMapper;
import com.vdl.system.domain.model.Cliente;
import com.vdl.system.domain.model.Orcamento;
import com.vdl.system.domain.model.OrcamentoItens;
import com.vdl.system.domain.model.Personalizacao;
import com.vdl.system.domain.repository.ClienteRepository;
import com.vdl.system.domain.repository.GramaturaRepository;
import com.vdl.system.domain.repository.OrcamentoRepository;
import com.vdl.system.domain.repository.OrdemCompraRepository;
import com.vdl.system.infra.exception.cliente.ClienteNaoEncontradoException;
import com.vdl.system.infra.exception.gramatura.GramaturaNaoEncontradaException;
import com.vdl.system.infra.exception.orcamento.*;
import com.vdl.system.infra.exception.personalizacao.CorNaoCadastradaException;
import com.vdl.system.infra.exception.personalizacao.QuantidadeCorMaiorQueLimiteException;
import com.vdl.system.pdf.PdfGenerator;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
public class OrcamentoService {

    private final OrcamentoRepository orcamentoRepository;
    private final GramaturaRepository gramaturaRepository;
    private final ClienteService clienteService;
    private final OrcamentoMapper orcamentoMapper;
    private final PrazoEntregaService prazoEntregaService;
    private final OrdemCompraRepository ordemCompraRepository;
    private final ClienteRepository clienteRepository;
    private final WhatsAppService whatsAppService;

    public OrcamentoService(OrcamentoRepository orcamentoRepository, GramaturaRepository gramaturaRepository, ClienteService clienteService, OrcamentoMapper orcamentoMapper, PrazoEntregaService prazoEntregaService, OrdemCompraRepository ordemCompraRepository, ClienteRepository clienteRepository, WhatsAppService whatsAppService) {
        this.orcamentoRepository = orcamentoRepository;
        this.gramaturaRepository = gramaturaRepository;
        this.clienteService = clienteService;
        this.orcamentoMapper = orcamentoMapper;
        this.prazoEntregaService = prazoEntregaService;
        this.ordemCompraRepository = ordemCompraRepository;
        this.clienteRepository = clienteRepository;
        this.whatsAppService = whatsAppService;
    }

    public Orcamento criarOrcamento(CriarOrcamentoRequestDTO dto) {

        log.info("Criando orçamento, cliente: {}, telefone: {}", dto.nomeCliente(), dto.telefone());

        boolean existeCaixaPersonalizada = dto.itens().stream()
                .anyMatch(item -> Boolean.TRUE.equals(item.personalizada()));

        if (Boolean.TRUE.equals(dto.personalizacaoAtiva())) {

            if (!existeCaixaPersonalizada) {
                throw new IllegalArgumentException(
                        "Personalização ativa, mas nenhuma caixa foi marcada como personalizada"
                );
            }

            if (dto.coresPersonalizada() == null || dto.coresPersonalizada().isEmpty()) {
                throw new CorNaoCadastradaException(
                        "Tem que ter pelo menos uma cor cadastrada!"
                );
            }

            if (dto.coresPersonalizada().size() > 2) {
                throw new QuantidadeCorMaiorQueLimiteException(
                        "Quantidade de cor excede o máximo permitido = 2"
                );
            }
        }

        Orcamento orcamento = new Orcamento();
        orcamento.setCodigo(gerarCodigo());
        orcamento.setNomeCliente(dto.nomeCliente());
        orcamento.setTelefone(padronizar(dto.telefone()));
        orcamento.setStatus(StatusOrcamento.PENDENTE);

        if (Boolean.TRUE.equals(dto.personalizacaoAtiva())) {
            Personalizacao personalizacao = new Personalizacao();
            personalizacao.setAtiva(true);
            personalizacao.setCores(dto.coresPersonalizada());
            personalizacao.setOrcamento(orcamento);

            orcamento.setPersonalizacao(personalizacao);
        }

        // 🔹 Itens (caixas)
        for (var itemDto : dto.itens()) {

            var gramatura = gramaturaRepository.findById(itemDto.idGramatura())
                    .orElseThrow(() ->
                            new GramaturaNaoEncontradaException("Gramatura não encontrada!")
                    );

            OrcamentoItens item = new OrcamentoItens();
            item.setOrcamento(orcamento);
            item.setComprimento(itemDto.comprimento());
            item.setLargura(itemDto.largura());
            item.setAltura(itemDto.altura());
            item.setGramatura(gramatura);
            item.setPersonalizada(itemDto.personalizada());

            Double comprimentoFinal = (item.getComprimento() * 2)
                    + (item.getLargura() * 2) + 30;

            Double valorUnLucro = 1.80;
            Double qtdPequena = comprimentoFinal
                    * (item.getLargura() + item.getAltura())
                    * gramatura.getValor() + valorUnLucro;

            Double qtdMedia = qtdPequena - 0.3;
            Double qtdGrande = qtdMedia - 0.5;

            item.setValorQtdPequena(BigDecimal.valueOf(qtdPequena));
            item.setValorQtdMedia(BigDecimal.valueOf(qtdMedia));
            item.setValorQtdGrande(BigDecimal.valueOf(qtdGrande));

            orcamento.getItens().add(item);
        }

        log.info("Orçamento criado com sucesso, número: {}", orcamento.getCodigo());

        return orcamentoRepository.save(orcamento);
    }


    @Transactional
    public Orcamento editarOrcamento(Long id, CriarOrcamentoRequestDTO dto) {

        log.info("Editando orçamento id: {}", id);

        Orcamento orcamento = orcamentoRepository.findById(id)
                .orElseThrow(() -> new OrcamentoNaoEncontradoExeption("Orçamento não encontrado"));

        if (!orcamento.getStatus().equals(StatusOrcamento.PENDENTE)) {
            throw new OrcamentoNaoPodeSerEditadoException(
                    "Somente orçamentos PENDENTES podem ser editados"
            );
        }

        if (ordemCompraRepository.existsByOrcamentoId(id)) {
            throw new OrcamentoComOrdemCompraException(
                    "Orçamento com ordem de compra não pode ser editado"
            );
        }

        if (Boolean.TRUE.equals(dto.personalizacaoAtiva())) {
            if (dto.coresPersonalizada() == null || dto.coresPersonalizada().isEmpty()) {
                throw new CorNaoCadastradaException("Tem que ter uma cor cadastrada pelo menos");
            }
            if (dto.coresPersonalizada().size() > 2) {
                throw new QuantidadeCorMaiorQueLimiteException("Quantidade de cor excede o máximo permitido = 2");
            }
        }

        if (Boolean.TRUE.equals(dto.personalizacaoAtiva())) {
            if (orcamento.getPersonalizacao() != null) {
                orcamento.getPersonalizacao().setAtiva(true);
                orcamento.getPersonalizacao().setCores(dto.coresPersonalizada());
            } else {
                Personalizacao novaPersonalizacao = new Personalizacao();
                novaPersonalizacao.setAtiva(true);
                novaPersonalizacao.setCores(dto.coresPersonalizada());
                novaPersonalizacao.setOrcamento(orcamento);

                orcamento.setPersonalizacao(novaPersonalizacao);
            }
        } else {
            if (orcamento.getPersonalizacao() != null) {
                orcamento.getPersonalizacao().setCores(new java.util.ArrayList<>());
                orcamento.getPersonalizacao().setAtiva(false);
                orcamento.getPersonalizacao().setOrcamento(null);
                orcamento.setPersonalizacao(null);
            }


            orcamento.setPersonalizacao(null);
        }


        orcamento.setNomeCliente(dto.nomeCliente());
        orcamento.setTelefone(padronizar(dto.telefone()));

        orcamento.getItens().clear();

        for (var itemDto : dto.itens()) {

            var gramatura = gramaturaRepository.findById(itemDto.idGramatura())
                    .orElseThrow(() -> new GramaturaNaoEncontradaException("Gramatura não encontrada"));

            OrcamentoItens item = new OrcamentoItens();
            item.setOrcamento(orcamento);
            item.setComprimento(itemDto.comprimento());
            item.setLargura(itemDto.largura());
            item.setAltura(itemDto.altura());
            item.setGramatura(gramatura);
            item.setPersonalizada(itemDto.personalizada());

            Double comprimentoFinal = (item.getComprimento() * 2)
                    + (item.getLargura() * 2)
                    + 30;

            Double area = (item.getAltura() + item.getLargura());
            Double valorBase = comprimentoFinal * area * gramatura.getValor();
            Double lucro = 1.80;

            Double pequena = valorBase + lucro;
            Double media = pequena - 0.3;
            Double grande = media - 0.5;

            item.setValorQtdPequena(BigDecimal.valueOf(pequena));
            item.setValorQtdMedia(BigDecimal.valueOf(media));
            item.setValorQtdGrande(BigDecimal.valueOf(grande));

            orcamento.getItens().add(item);
        }

        log.info("Orçamento editado com sucesso, id: {}", id);

        return orcamentoRepository.save(orcamento);
    }


    public void aprovarOrcamento(Long id) {
        log.info("Aprovar orçamento, id: {}", id);

        var orcamento = orcamentoRepository.findById(id).orElseThrow(() -> new OrcamentoNaoEncontradoExeption("Orçamento não encontrado!"));

        if (!orcamento.getStatus().equals(StatusOrcamento.PENDENTE)) {
            throw new OrcamentoJaAprovadoOuRecusadoException("Orçamento já aprovado ou recusado!");
        }

        orcamento.setStatus(StatusOrcamento.APROVADO);
        log.info("Oeçamento aprovado com sucesso, id: {}", id);

        orcamentoRepository.save(orcamento);

        whatsAppService.notificarOrcamentoAprovado(
                orcamento.getTelefone(),
                orcamento.getNomeCliente(),
                orcamento.getCodigo()
        );
    }

    public void reprovarOrcamento(Long id) {
        log.info("Reprovar orçamento, id: {}", id);

        Orcamento orcamento = orcamentoRepository.findById(id)
                .orElseThrow(() -> new OrcamentoJaAprovadoOuRecusadoException("Orçamento não encontrado!"));

        if (!orcamento.getStatus().equals(StatusOrcamento.PENDENTE)) {
            throw new OrcamentoJaAprovadoOuRecusadoException("[ERROR] Orçamento já aprovado ou recusado, tem que está pendente!");
        }

        orcamento.setStatus(StatusOrcamento.REPROVADO);
        log.info("Orçamento reprovado com sucesso");

        orcamentoRepository.save(orcamento);
    }

    public Orcamento vincularCliente(Long orcamentoId, ClienteRequestDTO dto) {
        log.info("Vuncular cliente ao orçamento com id: {}", orcamentoId);

        Orcamento orcamento = orcamentoRepository.findById(orcamentoId).orElseThrow(() -> new OrcamentoNaoEncontradoExeption("Orçamento não encontrado!"));

        if (!orcamento.getStatus().equals(StatusOrcamento.APROVADO)) {
            throw new OrcamentoNaoAprovadoException("O orçamento precisa está APROVADO para prosseguir");
        }

        if (orcamento.getCliente() != null) {
            throw new OrcamentoJaPossuiClienteVinculadoException("Orçamento já possui um cliente vinculado!");
        }

        Cliente cliente = clienteService.cadastrarClienteApartiDoOrcamento(orcamento.getNomeCliente(), orcamento.getTelefone(), dto);

        orcamento.setNomeCliente(cliente.getNomeCliente());

        orcamento.setCliente(cliente);
        log.info("Orçamento vinculado com sucesso, vinculado ao cliente: {}", cliente.getNomeCliente());

        return orcamentoRepository.save(orcamento);

    }

    public Orcamento buscarPorId(Long id) {
        return orcamentoRepository.findById(id)
                .orElseThrow(() -> new OrcamentoNaoEncontradoExeption("Orçamento não encontrado!"));
    }

    public Page<OrcamentoResponseDTO> listarOrcamentos(String status, Pageable pageable) {
        Page<Orcamento> page;
        if (status != null && !status.isBlank()) {
            page = orcamentoRepository.findByStatus(StatusOrcamento.valueOf(status), pageable);
        } else {
            page = orcamentoRepository.findAll(pageable);
        }

        return page.map(orcamentoMapper::toResponse);
    }

    public List<OrcamentoResponseDTO> buscarPorClienteId(Long clienteId) {
        log.info("Buscando orçamentos do cliente ID: {}", clienteId);

        if (!clienteRepository.existsById(clienteId)) {
            throw new ClienteNaoEncontradoException("Cliente não encontrado com o id: " + clienteId);
        }

        return orcamentoRepository.findByClienteId(clienteId)
                .stream()
                .map(orcamentoMapper::toResponse)
                .toList();
    }

    public ByteArrayInputStream gerarPdf(Long id) {
        log.info("Gerar pdf orçamento com o id: {}", id);

        var orcamento = orcamentoRepository.findById(id)
                .orElseThrow(() -> new OrcamentoNaoEncontradoExeption("Orçamento não encontrado!"));
        log.info("Pdf gerado com sucesso!");

        int diasUteis = prazoEntregaService.calcularPrazoDiasUteis(orcamento.getItens());

        String coresPdf = null;

        if (orcamento.getPersonalizacao() != null
                && orcamento.getPersonalizacao().getCores() != null
                && !orcamento.getPersonalizacao().getCores().isEmpty()) {

            coresPdf = orcamento.getPersonalizacao().getCores().stream()
                    .map(cor -> cor.name())
                    .collect(java.util.stream.Collectors.joining(", "));
        }

        return PdfGenerator.gerarOrcamentoPdf(orcamento.getCodigo(), orcamento.getNomeCliente(), orcamento.getTelefone(), orcamento.getDataCriacaoOcr(), orcamento.getItens(), diasUteis, coresPdf);
    }

    private String gerarCodigo() {
        var pagina = orcamentoRepository.findAllByOrderByIdDesc(PageRequest.of(0, 1));
        log.info("Gerar codigo sequencial");

        if (pagina.isEmpty()) {
            return "OCR-0001";
        }

        String ultimoCodigo = pagina.getContent().get(0).getCodigo();

        int numero = Integer.parseInt(ultimoCodigo.replace("OCR-", ""));
        numero++;

        return "OCR-" + String.format("%04d", numero);
    }

    private String padronizar(String telefone) {
        if (telefone == null) {
            return null;
        }
        log.info("Código gerado com sucesso!");

        return telefone.replaceAll("\\D", "");
    }

    public List<CriarOrcamentoItensResponseDTO> listarItensDoOrcamento(Long orcamentoId) {

        Orcamento orcamento = orcamentoRepository.findById(orcamentoId)
                .orElseThrow(() -> new OrcamentoNaoEncontradoExeption("Orçamento não encontrado"));

        return orcamento.getItens().stream()
                .map(item -> new CriarOrcamentoItensResponseDTO(
                        item.getId(),
                        item.getTipoCaixa(),
                        item.getComprimento(),
                        item.getLargura(),
                        item.getAltura(),
                        item.getGramatura().getId(),
                        item.getGramatura().getDescGramatura(),
                        item.getGramatura().getNumeroGramatura(),
                        item.getGramatura().getValor(),
                        item.getPersonalizada(),
                        item.getValorQtdPequena(),
                        item.getValorQtdMedia(),
                        item.getValorQtdGrande()
                ))
                .toList();
    }


}
