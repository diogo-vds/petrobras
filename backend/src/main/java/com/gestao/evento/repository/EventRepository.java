package com.gestao.evento.repository;

import com.gestao.evento.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    /**
     * Encontra todos os eventos que não foram excluídos, com paginação.
     */
    Page<Event> findByDeletedFalse(Pageable pageable);

    /**
     * Encontra um evento por ID que não foi excluído.
     */
    Optional<Event> findByIdAndDeletedFalse(Long id);

    /**
     * Encontra eventos por título que contenham a string (ignorando maiúsculas/minúsculas) e que não foram excluídos.
     */
    Page<Event> findByTitleContainingIgnoreCaseAndDeletedFalse(String title, Pageable pageable);

    /**
     * Encontra eventos por localização que contenham a string (ignorando maiúsculas/minúsculas) e que não foram excluídos.
     */
    Page<Event> findByLocationContainingIgnoreCaseAndDeletedFalse(String location, Pageable pageable);

    /**
     * Encontra eventos por um intervalo de datas e que não foram excluídos.
     */
    @Query("SELECT e FROM Event e WHERE e.eventDateTime BETWEEN :startDate AND :endDate AND e.deleted = false")
    Page<Event> findEventsByDateRange(@Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate,
                                      Pageable pageable);

    /**
     * Conta o número de eventos que não foram excluídos.
     */
    long countByDeletedFalse();

    /**
     * Verifica se um evento existe por ID e se não foi excluído.
     */
    boolean existsByIdAndDeletedFalse(Long id);
}