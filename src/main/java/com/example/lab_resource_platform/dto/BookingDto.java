package com.example.lab_resource_platform.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDto {
	
		@NotNull(message = "User id is required")
		private Long userId;
	
		@NotNull(message = "Equipment id is required")
		private Long equipmentId;

	    @NotNull(message = "Start time is required")
	    @Future(message = "Start time must be in the future")
	    private LocalDateTime startTime;

	    @NotNull(message = "End time is required")
	    @Future(message = "End time must be in the future")
	    private LocalDateTime endTime;
}


