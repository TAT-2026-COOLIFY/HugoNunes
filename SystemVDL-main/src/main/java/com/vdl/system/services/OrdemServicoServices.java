package com.vdl.system.services;

import com.vdl.system.domain.enumered.StatusOrdemCompra;
import com.vdl.system.domain.enumered.StatusProducao;
import com.vdl.system.domain.model.*;
import com.vdl.system.domain.repository.OrdemCompraRepository;
import com.vdl.system.domain.repository.OrdemServicoRepository;
import com.vdl.system.infra.exception.ordemCompra.OrdemCompraNaoEncontradoException;
import com.vdl.system.infra.exception.ordemServico.OrdemServicoJaGeradaException;
import com.vdl.system.infra.exception.ordemServico.OrdemServicoNaoEstaEmProducaoException;
import com.vdl.system.infra.exception.ordemServico.OrdemServicoNaoEstaoEmProducaoException;
import com.vdl.system.infra.exception.ordemServico.OrdemServicoVaziaException;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import com.vdl.system.domain.dto.ordemServico.ItemProduzidoDTO;
import com.vdl.system.infra.exception.ordemCompraItens.OrdemCompraItemQuantidadeInvalidaException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrdemServicoServices {

    private final OrdemCompraRepository ordemCompraRepository;
    private final OrdemServicoRepository ordemServicoRepository;
    private final PrazoEntregaService prazoEntregaService;
    private final WhatsAppService whatsAppService;

    public OrdemServicoServices(OrdemCompraRepository ordemCompraRepository, OrdemServicoRepository ordemServicoRepository, PrazoEntregaService prazoEntregaService, WhatsAppService whatsAppService) {
        this.ordemCompraRepository = ordemCompraRepository;
        this.ordemServicoRepository = ordemServicoRepository;
        this.prazoEntregaService = prazoEntregaService;
        this.whatsAppService = whatsAppService;
    }

    @Transactional
    public List<OrdemServico> gerarOrdemServico(Long ordemCompraId) {
        OrdemCompra ordemCompra = ordemCompraRepository.findById(ordemCompraId)
                .orElseThrow(() -> new OrdemCompraNaoEncontradoException("Ordem de compra não encontrado id: " + ordemCompraId));

        if (ordemServicoRepository.existsByOrdemCompraId(ordemCompraId)) {
            throw new OrdemServicoJaGeradaException("Ordem de serviço já gerada!");
        }

        String codigoOc = ordemCompra.getCodigo();
        String numero = codigoOc.replaceAll("\\D+", "");
        String codigoOs = "OS-" + numero;

        int prazoDias = prazoEntregaService.calcularPrazoDiasUteis(ordemCompra.getOrcamento().getItens());
        LocalDate prazoEntrega = LocalDate.now().plusDays(prazoDias);

        int sequencia = 1;

        List<OrdemServico> lista = new ArrayList<>();

        for (OrdemCompraItem item : ordemCompra.getItens()) {

            OrdemServico os = new OrdemServico();
            os.setCodigo(codigoOs);
            os.setSequencial(sequencia++);
            os.setOrdemCompra(ordemCompra);
            os.setOrdemCompraItem(item);
            os.setQuantidade(item.getQuantidade());
            os.setDataCriacao(LocalDate.now());
            os.setPrazoMaximoEntrega(LocalDate.now().plusDays(prazoDias));
            os.setStatusProducao(StatusProducao.EM_PRODUCAO);

            lista.add(os);
        }

        ordemCompra.setStatus(StatusOrdemCompra.FINALIZADO);
        ordemCompraRepository.save(ordemCompra);

        List<OrdemServico> salvos = ordemServicoRepository.saveAll(lista);

        Cliente cliente = ordemCompra.getCliente();
        if (cliente != null) {
            whatsAppService.notificarPedidoEmProducao(
                    cliente.getTelefone(),
                    cliente.getNomeCliente(),
                    codigoOs
            );
        }

        return salvos;
    }

    @Transactional
    public void entregaPedido(String codigo) {
        entregaPedido(codigo, List.of());
    }

    @Transactional
    public void entregaPedido(String codigo, List<ItemProduzidoDTO> quantidadesProduzidas) {
        List<OrdemServico> itens = ordemServicoRepository.findByCodigo(codigo);

        if (itens.isEmpty()) {
            throw new OrdemServicoVaziaException("Ordem de serviço não encontrada!");
        }

        boolean todosProntosOuEmProducao = itens.stream()
                .allMatch(o -> o.getStatusProducao() == StatusProducao.EM_PRODUCAO
                        || o.getStatusProducao() == StatusProducao.CONCLUIDA);

        if (!todosProntosOuEmProducao) {
            throw new OrdemServicoNaoEstaoEmProducaoException("Para concluir, todas as ordens de serviço precisam estar em produção ou já concluídas.");
        }

        Map<Long, Integer> qtdPorItem = new HashMap<>();
        if (quantidadesProduzidas != null) {
            quantidadesProduzidas.stream()
                    .filter(Objects::nonNull)
                    .filter(i -> i.id() != null)
                    .forEach(i -> qtdPorItem.put(i.id(), i.quantidadeProduzida()));
        }

        for (OrdemServico os : itens) {
            // Itens já concluídos individualmente mantêm a quantidade registrada neles
            if (os.getStatusProducao() == StatusProducao.EM_PRODUCAO) {
                registrarQuantidadeProduzida(os, qtdPorItem.get(os.getId()));
            } else if (os.getQuantidadeProduzida() == null) {
                registrarQuantidadeProduzida(os, null);
            }
            os.setStatusProducao(StatusProducao.CONCLUIDA);
        }
        ordemServicoRepository.saveAll(itens);

        notificarLotePronto(itens);
    }

    public String getDescricaoPersonalizacao(OrcamentoItens item) {
        if (!Boolean.TRUE.equals(item.getPersonalizada())) {
            return "Sem personalização";
        }

        Orcamento orcamento = item.getOrcamento();

        if (orcamento.getPersonalizacao() == null || !Boolean.TRUE.equals(orcamento.getPersonalizacao().getAtiva())) {
            return "Personalização não informada!";
        }

        var cores = orcamento.getPersonalizacao().getCores();

        if (cores == null || cores.isEmpty()) {
            return "Personalização sem cor definida!";
        }

        return cores.stream()
                .map(Enum::name)
                .reduce((a, b) -> a + " | " + b)
                .orElse("");
    }

    @Transactional
    public void concluirItemUnico(Long id) {
        concluirItemUnico(id, null);
    }

    @Transactional
    public void concluirItemUnico(Long id, Integer quantidadeProduzida) {
        OrdemServico osItem = ordemServicoRepository.findById(id)
                .orElseThrow(() -> new OrdemServicoVaziaException("Item da ordem de serviço não encontrado!"));

        if (osItem.getStatusProducao() != StatusProducao.EM_PRODUCAO) {
            throw new OrdemServicoNaoEstaEmProducaoException("Este item não está em produção!");
        }

        registrarQuantidadeProduzida(osItem, quantidadeProduzida);
        osItem.setStatusProducao(StatusProducao.CONCLUIDA);
        ordemServicoRepository.save(osItem);

        List<OrdemServico> itensDoLote = ordemServicoRepository.findByCodigo(osItem.getCodigo());
        boolean loteTerminouAgora = itensDoLote.stream()
                .noneMatch(it -> it.getStatusProducao() == StatusProducao.EM_PRODUCAO);

        if (loteTerminouAgora) {
            notificarLotePronto(itensDoLote);
        }
    }

    // Quantidade nula = permaneceu a mesma do orçamento.
    // Valor final = preço unitário acordado x quantidade produzida.
    private void registrarQuantidadeProduzida(OrdemServico os, Integer quantidadeInformada) {
        int quantidadeFinal = quantidadeInformada != null ? quantidadeInformada : os.getQuantidade();

        if (quantidadeFinal <= 0) {
            throw new OrdemCompraItemQuantidadeInvalidaException(
                    "Quantidade produzida inválida para o item #" + os.getSequencial() + ": tem que ser maior que 0");
        }

        BigDecimal precoUnitario = os.getOrdemCompraItem().getPrecoUnitario();
        if (precoUnitario == null) {
            precoUnitario = BigDecimal.ZERO;
        }

        os.setQuantidadeProduzida(quantidadeFinal);
        os.setValorTotalFinal(precoUnitario
                .multiply(BigDecimal.valueOf(quantidadeFinal))
                .setScale(2, RoundingMode.HALF_UP));
    }

    private void notificarLotePronto(List<OrdemServico> itensDoLote) {
        OrdemServico primeiro = itensDoLote.get(0);
        Cliente cliente = primeiro.getOrdemCompra().getCliente();
        if (cliente == null) {
            return;
        }

        int quantidadeTotal = itensDoLote.stream()
                .mapToInt(os -> os.getQuantidadeProduzida() != null ? os.getQuantidadeProduzida() : os.getQuantidade())
                .sum();

        BigDecimal valorTotal = itensDoLote.stream()
                .map(os -> os.getValorTotalFinal() != null ? os.getValorTotalFinal() : os.getOrdemCompraItem().getValorTotal())
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        whatsAppService.notificarPedidoProntoParaRetirada(
                cliente.getTelefone(),
                cliente.getNomeCliente(),
                primeiro.getCodigo(),
                quantidadeTotal,
                valorTotal
        );
    }
}
