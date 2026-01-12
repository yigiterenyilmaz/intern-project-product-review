package com.example.productreview.service;

import com.example.productreview.model.AppNotification;
import com.example.productreview.model.WishlistItem;
import com.example.productreview.repository.NotificationRepository;
import com.example.productreview.repository.WishlistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {
    
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final WishlistRepository wishlistRepository;
    private final NotificationRepository notificationRepository;

    public UserService(WishlistRepository wishlistRepository, NotificationRepository notificationRepository) {
        this.wishlistRepository = wishlistRepository;
        this.notificationRepository = notificationRepository;
    }

    // --- Wishlist ---

    public List<Long> getWishlist(String userId) {
        return wishlistRepository.findByUserId(userId).stream()
                .map(WishlistItem::getProductId)
                .collect(Collectors.toList());
    }

    @Transactional
    public void toggleWishlist(String userId, Long productId) {
        var existing = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            wishlistRepository.delete(existing.get());
        } else {
            wishlistRepository.save(new WishlistItem(userId, productId));
        }
    }

    // --- Notifications ---

    public List<AppNotification> getNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }
    
    public void markAllAsRead(String userId) {
        List<AppNotification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(n -> !n.isRead())
                .collect(Collectors.toList());
        
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void createNotification(String userId, String title, String message, Long productId) {
        notificationRepository.save(new AppNotification(userId, title, message, productId));
    }
    
    // ✨ Added Transactional and Logging
    @Transactional
    public void deleteNotification(Long notificationId) {
        log.info("Deleting notification with ID: {}", notificationId);
        if (notificationRepository.existsById(notificationId)) {
            notificationRepository.deleteById(notificationId);
            log.info("Deleted notification {}", notificationId);
        } else {
            log.warn("Notification {} not found for deletion", notificationId);
        }
    }
    
    @Transactional
    public void deleteAllNotifications(String userId) {
        List<AppNotification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notificationRepository.deleteAll(notifications);
    }
}
