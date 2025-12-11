package com.smartattendance.backend.repository;

import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganisationRepository extends JpaRepository<Organisation, Long> {
    Optional <Organisation> findByIdAndDeletedFalse(Long id);

    List<Organisation> findByDeletedFalse();


}

