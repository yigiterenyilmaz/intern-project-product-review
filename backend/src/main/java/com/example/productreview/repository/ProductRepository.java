package com.example.productreview.repository;

import com.example.productreview.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    
    // ✨ Using MEMBER OF for cleaner collection search
    @Query("SELECT p FROM Product p WHERE :category MEMBER OF p.categories")
    Page<Product> findByCategory(@Param("category") String category, Pageable pageable);
    
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Product> findByNameContainingIgnoreCase(@Param("name") String name, Pageable pageable);
    
    // ✨ Using MEMBER OF with Name search
    @Query("SELECT p FROM Product p WHERE :category MEMBER OF p.categories AND LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Product> findByCategoryAndNameContainingIgnoreCase(@Param("category") String category, @Param("name") String name, Pageable pageable);
}
