package com.smartattendance.backend.repository;

import com.smartattendance.backend.entity.Users;
import com.smartattendance.backend.entity.Organisation;
import com.smartattendance.backend.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {

    Optional<Users> findByEmail(String email);

    List<Users> findByEmailAndOrganisation(String email, Organisation org);

    List<Users> findByOrganisation(Organisation organisation);

    @Query("SELECT u FROM Users u WHERE LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Users> searchByName(@Param("name") String name);

    List<Users> findByDeletedFalse();

    Optional<Users> findByIdAndDeletedFalse(Long id);

    Optional<Users> findByEmailAndDeletedFalse(String email);

    List<Users> findByOrganisationAndDeletedFalse(Organisation organisation);

    @Query("SELECT u FROM Users u WHERE u.deleted = false AND LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Users> searchByNameAndNotDeleted(@Param("name") String name);

    Optional<Users> findByEmailAndOrganisationAndDeletedFalse(String email, Organisation organisation);

    Optional<Users> findByIdAndOrganisation(Long id, Organisation organisation);

    @Query("SELECT u FROM Users u " +
            "WHERE u.deleted = false " +
            "AND u.organisation = :organisation " +
            "AND LOWER(CONCAT(u.firstName, ' ', u.lastName)) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Users> searchByNameAndOrganisation(@Param("name") String name,
                                            @Param("organisation") Organisation organisation);
    boolean existsByEmailAndDeletedFalse(String email);

    //  Check if email exists in specific org
    boolean existsByEmailAndOrganisationAndDeletedFalse(String email, Organisation organisation);

    boolean existsByRole(RoleType role);
}
