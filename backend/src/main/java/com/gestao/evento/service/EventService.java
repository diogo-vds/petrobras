package com.gestao.evento.service;

import com.gestao.evento.dto.EventCreateDTO;
import com.gestao.evento.dto.EventResponseDTO;
import com.gestao.evento.dto.EventUpdateDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EventService {
    Page<EventResponseDTO> getAllEvents(Pageable pageable);
    EventResponseDTO getEventById(Long id);
    EventResponseDTO createEvent(EventCreateDTO eventCreateDTO);
    EventResponseDTO updateEvent(Long id, EventUpdateDTO eventUpdateDTO);
    void deleteEvent(Long id);

    Integer getContador();
}
