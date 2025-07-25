package com.gestao.evento.service;

import com.gestao.evento.dto.EventCreateDTO;
import com.gestao.evento.dto.EventResponseDTO;
import com.gestao.evento.dto.EventUpdateDTO;
import com.gestao.evento.entity.Event;
import com.gestao.evento.exception.EventNotFoundException;
import com.gestao.evento.repository.EventRepository;
import com.gestao.evento.service.impl.EventServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private EventServiceImpl eventService;

    private Event event;
    private EventCreateDTO eventCreateDTO;
    private EventUpdateDTO eventUpdateDTO;
    private EventResponseDTO eventResponseDTO;

    @BeforeEach
    void setUp() {
        event = Event.builder()
                .id(1L)
                .title("Evento de Teste")
                .description("Descrição do Evento de Teste")
                .eventDateTime(LocalDateTime.of(2025, 1, 1, 10, 0))
                .location("Local de Teste")
                .deleted(false)
                .createdAt(LocalDateTime.now().minusDays(1))
                .updatedAt(LocalDateTime.now().minusHours(1))
                .build();

        eventCreateDTO = EventCreateDTO.builder()
                .titulo("Novo Evento")
                .descricao("Descrição do Novo Evento")
                .dataEvento(LocalDateTime.of(2025, 2, 2, 14, 0))
                .local("Novo Local")
                .build();

        eventUpdateDTO = EventUpdateDTO.builder()
                .titulo("Evento Atualizado")
                .descricao("Descrição Atualizada")
                .dataEvento(LocalDateTime.of(2025, 3, 3, 16, 0))
                .local("Local Atualizado")
                .build();

        eventResponseDTO = EventResponseDTO.builder()
                .id(1L)
                .titulo("Evento de Teste")
                .descricao("Descrição do Evento de Teste")
                .dataHora(LocalDateTime.of(2025, 1, 1, 10, 0))
                .local("Local de Teste")
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }

    @Test
    @DisplayName("Deve retornar uma página de eventos não excluídos com sucesso")
    void testGetAllEvents_Success() {
        List<Event> eventsList = Collections.singletonList(event);
        Page<Event> eventsPage = new PageImpl<>(eventsList);
        Pageable pageable = PageRequest.of(0, 10);

        when(eventRepository.findByDeletedFalse(pageable)).thenReturn(eventsPage);

        Page<EventResponseDTO> result = eventService.getAllEvents(pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(eventResponseDTO.getTitulo(), result.getContent().get(0).getTitulo());

        verify(eventRepository, times(1)).findByDeletedFalse(pageable);
    }


    @Test
    @DisplayName("Deve excluir (soft delete) um evento com sucesso")
    void testDeleteEvent_Success() {
        Long eventId = 1L;

        when(eventRepository.findByIdAndDeletedFalse(eventId)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenReturn(event);

        eventService.deleteEvent(eventId);

        verify(eventRepository, times(1)).findByIdAndDeletedFalse(eventId);
        verify(eventRepository, times(1)).save(argThat(e -> e.getDeleted()));
    }

    @Test
    @DisplayName("Deve lançar EventNotFoundException ao tentar excluir um evento não encontrado")
    void testDeleteEvent_NotFound() {
        Long nonExistentId = 99L;

        when(eventRepository.findByIdAndDeletedFalse(nonExistentId)).thenReturn(Optional.empty());

        Exception exception = assertThrows(EventNotFoundException.class, () -> {
            eventService.deleteEvent(nonExistentId);
        });

        String expectedMessage = "Evento não encontrado com id: " + nonExistentId;
        String actualMessage = exception.getMessage();
        assertTrue(actualMessage.contains(expectedMessage));

        verify(eventRepository, never()).save(any(Event.class));
    }
}
