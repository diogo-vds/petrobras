package com.gestao.evento.controller;


import com.gestao.evento.dto.EventCreateDTO;
import com.gestao.evento.dto.EventResponseDTO;
import com.gestao.evento.dto.EventUpdateDTO;
import com.gestao.evento.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
@Validated
@Slf4j
@Tag(name = "Events", description = "Event management API")
public class EventController {

    private final EventService eventService;

    @GetMapping
    @Operation(summary = "Listar todos os eventos com paginação",
            description = "Recupera uma lista paginada de todos os eventos que não foram excluídos")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Eventos recuperados com sucesso"),
            @ApiResponse(responseCode = "400", description = "Parâmetros de paginação inválidos")
    })
    public ResponseEntity<Page<EventResponseDTO>> getAllEvents(
            @Parameter(description = "Número da página (base 0)", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Tamanho da página", example = "10")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "Direção da ordenação", example = "ASC")
            @RequestParam(defaultValue = "ASC") String sortDirection,

            @Parameter(description = "Campo para ordenação", example = "eventDateTime")
            @RequestParam(defaultValue = "eventDateTime") String sortBy) {

        log.info("GET /api/events - page: {}, size: {}, sortBy: {}, sortDirection: {}",
                page, size, sortBy, sortDirection);

        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<EventResponseDTO> events = eventService.getAllEvents(pageable);

        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obter evento por ID",
            description = "Recupera um evento específico pelo seu ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Evento recuperado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Evento não encontrado")
    })
    public ResponseEntity<EventResponseDTO> getEventById(
            @Parameter(description = "ID do Evento", example = "1")
            @PathVariable Long id) {

        log.info("GET /api/events/{}", id);

        EventResponseDTO event = eventService.getEventById(id);
        return ResponseEntity.ok(event);
    }

    @PostMapping
    @Operation(summary = "Criar novo evento",
            description = "Cria um novo evento com as informações fornecidas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Evento criado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados do evento inválidos")
    })
    public ResponseEntity<EventResponseDTO> createEvent(
            @Parameter(description = "Dados do evento para criar")
            @Valid @RequestBody EventCreateDTO eventDTO) {

        log.info("POST /api/events - Criando evento com título: {}", eventDTO.getTitulo());

        EventResponseDTO createdEvent = eventService.createEvent(eventDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar evento existente",
            description = "Atualiza um evento existente com as informações fornecidas")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Evento atualizado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Evento não encontrado"),
            @ApiResponse(responseCode = "400", description = "Dados do evento inválidos")
    })
    public ResponseEntity<EventResponseDTO> updateEvent(
            @Parameter(description = "ID do Evento", example = "1")
            @PathVariable Long id,

            @Parameter(description = "Dados do evento atualizados")
            @Valid @RequestBody EventUpdateDTO eventDTO) {

        log.info("PUT /api/events/{} - Atualizando evento com título: {}", id, eventDTO.getTitulo());

        EventResponseDTO updatedEvent = eventService.updateEvent(id, eventDTO);
        return ResponseEntity.ok(updatedEvent);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir evento (exclusão lógica)",
            description = "Exclui logicamente um evento - o evento será marcado como excluído, mas não removido fisicamente")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Evento excluído com sucesso"),
            @ApiResponse(responseCode = "404", description = "Evento não encontrado")
    })
    public ResponseEntity<Void> deleteEvent(
            @Parameter(description = "ID do Evento", example = "1")
            @PathVariable Long id) {

        log.info("DELETE /api/events/{}", id);

        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/atomico")
    @Operation(summary = "Retorna quantidade de eventos",
            description = "Retorna a quantidade total de eventos cadastrados de acordo com o contador atomico")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Contador recuperado com sucesso"),
            @ApiResponse(responseCode = "404", description = "Contador não encontrado")
    })
    public ResponseEntity<Integer> getContador() {
        log.info("Contador /api/events/atomico");

        return ResponseEntity.ok(eventService.getContador());
    }
}