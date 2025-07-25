package com.gestao.evento.config;

import com.gestao.evento.entity.Event;
import com.gestao.evento.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final EventRepository eventRepository;

    @Override
    public void run(String... args) throws Exception {
        if (eventRepository.count() == 0) {
            loadSampleData();
            log.info("Dados de exemplo carregados com sucesso!");
        }
    }

    private void loadSampleData() {
        List<Event> events = Arrays.asList(
                Event.builder()
                        .title("Conferência Tech 2025")
                        .description("Evento sobre tecnologia e inovação")
                        .eventDateTime(LocalDateTime.now().plusDays(30))
                        .location("Centro de Convenções - SP")
                        .deleted(false)
                        .build(),

                Event.builder()
                        .title("Workshop Spring Boot")
                        .description("Aprenda Spring Boot na prática")
                        .eventDateTime(LocalDateTime.now().plusDays(15))
                        .location("Auditório Tech")
                        .deleted(false)
                        .build(),

                Event.builder()
                        .title("Meetup Desenvolvedores")
                        .description("Encontro mensal da comunidade")
                        .eventDateTime(LocalDateTime.now().plusDays(7))
                        .location("Coworking Space")
                        .deleted(false)
                        .build(),

                Event.builder()
                        .title("Hackathon 2025")
                        .description("Competição de programação")
                        .eventDateTime(LocalDateTime.now().plusDays(45))
                        .location("Universidade Tech")
                        .deleted(false)
                        .build(),

                Event.builder()
                        .title("Evento Passado")
                        .description("Este evento já aconteceu")
                        .eventDateTime(LocalDateTime.now().minusDays(10))
                        .location("Local Antigo")
                        .deleted(false)
                        .build()
        );

        eventRepository.saveAll(events);
    }
}