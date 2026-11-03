package com.vdl.system.services;

import com.vdl.system.domain.dto.pdf.OrdemEntregaPdfDTO;
import com.vdl.system.domain.enumered.StatusProducao;
import com.vdl.system.domain.model.*;
import com.vdl.system.domain.repository.OrdemEntregaRepository;
import com.vdl.system.domain.repository.OrdemServicoRepository;
import com.vdl.system.infra.exception.ordemEntrega.OrdemEntregaNaoEncontradaException;
import com.vdl.system.infra.exception.ordemServico.OrdemServicoNaoEncontradaException;
import com.vdl.system.infra.exception.ordemServico.OrdemServicoNaoEstaoEmConcluidaException;
import com.vdl.system.pdf.PdfGenerator;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class OrdemEntregaServices {

    private final OrdemServicoRepository ordemServicoRepository;
    private final OrdemEntregaRepository ordemEntregaRepository;

    public OrdemEntregaServices(OrdemServicoRepository ordemServicoRepository, OrdemEntregaRepository ordemEntregaRepository) {
        this.ordemServicoRepository = ordemServicoRepository;
        this.ordemEntregaRepository = ordemEntregaRepository;
    }

    @jakarta.transaction.Transactional
    public OrdemEntrega gerarOrdemEntrega(Long ordemServicoId) {
        OrdemServico ordemServico = ordemServicoRepository.findById(ordemServicoId)
                .orElseThrow(() -> new OrdemServicoNaoEncontradaException("Ordem de serviço não encontrada!"));

        if (!ordemServico.getStatusProducao().equals(StatusProducao.CONCLUIDA)) {
            throw new OrdemServicoNaoEstaoEmConcluidaException("Ordem de serviço precisa estar concluída!");
        }

        String codigoOs = ordemServico.getCodigo();
        String numero = codigoOs.replaceAll("\\D+", "");
        String codigoOe = "OE-" + numero;

        OrdemEntrega ordemEntrega = new OrdemEntrega();
        ordemEntrega.setCodigo(codigoOe);
        ordemEntrega.setOrdemServico(ordemServico);

        // Busca todos os itens do mesmo lote (mesmo código de OS) e marca como ENTREGUE
        List<OrdemServico> todosItensDoLote = new ArrayList<>(ordemServicoRepository.findByCodigo(codigoOs));
        for (OrdemServico itemLote : todosItensDoLote) {
            itemLote.setStatusProducao(StatusProducao.ENTREGUE);
        }
        ordemServicoRepository.saveAll(todosItensDoLote);

        // Ordena pelo sequencial para os itens saírem na ordem certa no PDF
        todosItensDoLote.sort(Comparator.comparing(
                OrdemServico::getSequencial, Comparator.nullsLast(Integer::compareTo)));

        // Usa a quantidade REAL fabricada e o valor final (dados corretos para a nota fiscal)
        for (OrdemServico osItem : todosItensDoLote) {
            OrdemCompraItem item = osItem.getOrdemCompraItem();

            int quantidadeFinal = osItem.getQuantidadeProduzida() != null
                    ? osItem.getQuantidadeProduzida()
                    : item.getQuantidade();

            BigDecimal valorTotalFinal = osItem.getValorTotalFinal() != null
                    ? osItem.getValorTotalFinal()
                    : item.getPrecoUnitario().multiply(BigDecimal.valueOf(quantidadeFinal)).setScale(2, RoundingMode.HALF_UP);

            OrdemEntregaItem entregaItem = new OrdemEntregaItem();
            entregaItem.setOrdemEntrega(ordemEntrega);

            entregaItem.setQuantidade(quantidadeFinal);
            entregaItem.setLargura(item.getOrcamentoItens().getLargura());
            entregaItem.setAltura(item.getOrcamentoItens().getAltura());
            entregaItem.setComprimento(item.getOrcamentoItens().getComprimento());
            entregaItem.setNumeroGramatura(item.getOrcamentoItens().getGramatura().getNumeroGramatura());
            entregaItem.setDescricaoGramatura(item.getOrcamentoItens().getGramatura().getDescGramatura());
            entregaItem.setPrecoUnitario(item.getPrecoUnitario());
            entregaItem.setValorTotal(valorTotalFinal);

            ordemEntrega.getItens().add(entregaItem);
        }

        return ordemEntregaRepository.save(ordemEntrega);
    }

    public String buscarCodigo(Long id) {
        return ordemEntregaRepository.findById(id)
                .map(OrdemEntrega::getCodigo)
                .orElse(String.valueOf(id));
    }

    public ByteArrayInputStream gerarPdf(Long id) {
        OrdemEntrega ordemEntrega = ordemEntregaRepository.findById(id)
                .orElseThrow(() -> new OrdemEntregaNaoEncontradaException("Ordem de entrega não encontrado!"));

        Cliente cliente = ordemEntrega
                .getOrdemServico()
                .getOrdemCompra()
                .getCliente();

        OrdemEntregaPdfDTO pdfDTO = new OrdemEntregaPdfDTO(
                ordemEntrega.getCodigo(),
                cliente.getNomeCliente(),
                cliente.getCpfCnpj(),
                cliente.getInscricaoMunicipal(),
                cliente.getEndereco().getRua() + " - " +
                        cliente.getEndereco().getBairro() + " - " +
                        cliente.getEndereco().getCep() + " - " +
                        cliente.getEndereco().getMunicipio(),
                cliente.getTelefone(),
                cliente.getEmail(),
                ordemEntrega.getDataEntrega(),
                ordemEntrega.getItens()
        );

        return PdfGenerator.gerarOrdemEntregaPdf(pdfDTO);
    }
}