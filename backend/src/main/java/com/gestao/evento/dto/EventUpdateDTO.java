package com.gestao.evento.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventUpdateDTO {

    @NotBlank(message = "Titúlo Obrigátorio")
    @Size(max = 100, message = "Titúlo não pode ter mais de 100 caracteres")
    private String titulo;

    @Size(max = 1000, message = "Descrição não pode ter mais de 1000 caracteres")
    private String descricao;

    @NotNull(message = "Data e Hora Obrigatórios")
    @FutureOrPresent(message = "A data e a hora do evento devem estar no futuro ou no presente")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dataEvento;

    @NotBlank(message = "Local Obrigatório")
    @Size(max = 200, message = "Local não deve ter mais de 200 caracteres")
    private String local;
}
