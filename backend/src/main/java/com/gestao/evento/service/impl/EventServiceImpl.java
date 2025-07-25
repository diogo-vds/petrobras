package com.gestao.evento.service.impl;

import com.gestao.evento.dto.EventCreateDTO;
import com.gestao.evento.dto.EventResponseDTO;
import com.gestao.evento.dto.EventUpdateDTO;
import com.gestao.evento.entity.Event;
import com.gestao.evento.exception.EventNotFoundException;
import com.gestao.evento.repository.EventRepository;
import com.gestao.evento.service.EventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;

    private final AtomicInteger contador = new AtomicInteger(0);

    @Override
    @Transactional(readOnly = true)
    public Page<EventResponseDTO> getAllEvents(Pageable pageable) {
        log.info("Buscando todos os eventos com paginação: página={}, tamanho={}", pageable.getPageNumber(), pageable.getPageSize());

        Page<Event> events = eventRepository.findByDeletedFalse(pageable);
        return events.map(this::mapToResponseDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public EventResponseDTO getEventById(Long id) {
        log.info("Buscando evento com id: {}", id);

        Event event = eventRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EventNotFoundException("Evento não encontrado com id: " + id));

        return mapToResponseDTO(event);
    }

    @Override
    public EventResponseDTO createEvent(EventCreateDTO eventCreateDTO) {
        log.info("Criando novo evento com título: {}", eventCreateDTO.getTitulo());

        Event event = Event.builder()
                .title(eventCreateDTO.getTitulo())
                .description(eventCreateDTO.getDescricao())
                .eventDateTime(eventCreateDTO.getDataEvento())
                .location(eventCreateDTO.getLocal())
                .deleted(false)
                .build();

        Event savedEvent = eventRepository.save(event);
        log.info("Evento criado com sucesso com id: {}", savedEvent.getId());
        contador.incrementAndGet();
        return mapToResponseDTO(savedEvent);
    }

    @Override
    public EventResponseDTO updateEvent(Long id, EventUpdateDTO eventUpdateDTO) {
        log.info("Atualizando evento com id: {}", id);

        Event existingEvent = eventRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EventNotFoundException("Evento não encontrado com id: " + id));

        existingEvent.setTitle(eventUpdateDTO.getTitulo());
        existingEvent.setDescription(eventUpdateDTO.getDescricao());
        existingEvent.setEventDateTime(eventUpdateDTO.getDataEvento());
        existingEvent.setLocation(eventUpdateDTO.getLocal());

        Event updatedEvent = eventRepository.save(existingEvent);
        log.info("Evento atualizado com sucesso com id: {}", updatedEvent.getId());

        return mapToResponseDTO(updatedEvent);
    }

    @Override
    public void deleteEvent(Long id) {
        log.info("Excluindo (soft delete) evento com id: {}", id);

        Event event = eventRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EventNotFoundException("Evento não encontrado com id: " + id));

        event.setDeleted(true);
        eventRepository.save(event);
        contador.decrementAndGet();
        log.info("Evento excluído (soft delete) com sucesso com id: {}", id);
    }

    @Override
    public Integer getContador() {
        return contador.get();
    }

    private EventResponseDTO mapToResponseDTO(Event event) {
        return EventResponseDTO.builder()
                .id(event.getId())
                .titulo(event.getTitle())
                .descricao(event.getDescription())
                .dataHora(event.getEventDateTime())
                .local(event.getLocation())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}

