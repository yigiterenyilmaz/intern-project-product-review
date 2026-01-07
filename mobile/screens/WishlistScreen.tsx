// WishlistScreen - Display user's favorite products
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenWrapper } from '../components/ScreenWrapper';
import { SelectableWishlistCard } from '../components/SelectableWishlistCard';
import { useWishlist, WishlistItem } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '../constants/theme';

export const WishlistScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors } = useTheme();
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // Grid mode toggle
  const [gridMode, setGridMode] = useState<1 | 2 | 4>(2);
  
  // Multi-select mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const numColumns = gridMode;

  // Load saved grid mode
  useEffect(() => {
    loadGridMode();
  }, []);

  const loadGridMode = async () => {
    try {
      const saved = await AsyncStorage.getItem('wishlist_grid_mode');
      if (saved === '1' || saved === '2' || saved === '4') {
        setGridMode(parseInt(saved) as 1 | 2 | 4);
      }
    } catch (error) {
      console.error('Error loading grid mode:', error);
    }
  };

  const saveGridMode = async (mode: 1 | 2 | 4) => {
    try {
      await AsyncStorage.setItem('wishlist_grid_mode', String(mode));
    } catch (error) {
      console.error('Error saving grid mode:', error);
    }
  };

  const toggleGridMode = () => {
    setGridMode(prev => {
      const next = prev === 1 ? 2 : prev === 2 ? 4 : 1;
      saveGridMode(next);
      return next;
    });
  };

  const getGridIcon = (): keyof typeof Ionicons.glyphMap => {
    if (gridMode === 1) return 'list';
    if (gridMode === 2) return 'grid';
    return 'apps';
  };

  const stats = useMemo(() => {
    const totalPrice = wishlist.reduce((sum, item) => sum + (item.price || 0), 0);
    const avgRating = wishlist.length > 0
      ? wishlist.reduce((sum, item) => sum + (item.averageRating || 0), 0) / wishlist.length
      : 0;

    return {
      count: wishlist.length,
      totalPrice,
      avgRating,
    };
  }, [wishlist]);

  // Selection handlers
  const handleCardPress = (item: WishlistItem) => {
    if (isSelectionMode) {
      // Toggle selection
      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedItems(newSelected);
      
      // Exit if no items selected
      if (newSelected.size === 0) {
        setIsSelectionMode(false);
      }
    } else {
      // Navigate to product details
      navigation.navigate('ProductDetails', {
        productId: item.id,
        imageUrl: item.imageUrl,
        name: item.name,
      } as any);
    }
  };

  const handleCardLongPress = (item: WishlistItem) => {
    setIsSelectionMode(true);
    setSelectedItems(new Set([item.id]));
  };

  const handleBulkDelete = () => {
    selectedItems.forEach(id => removeFromWishlist(id));
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleCancelSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <SelectableWishlistCard
      item={item}
      isSelectionMode={isSelectionMode}
      isSelected={selectedItems.has(item.id)}
      onPress={handleCardPress}
      onLongPress={handleCardLongPress}
      onRemove={removeFromWishlist}
      width={numColumns > 1 ? `${(100 / numColumns) - (numColumns > 2 ? 2 : 1)}%` : '100%'}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.muted }]}>
        <Ionicons name="heart-outline" size={64} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your wishlist is empty</Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Start adding your favorite products to see them here
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('ProductList')}
        activeOpacity={0.8}
      >
        <Text style={[styles.emptyButtonText, { color: colors.primaryForeground }]}>
          Browse Products
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatsHeader = () => (
    <View>
      {wishlist.length > 0 && (
        <View style={[styles.statsCard, { backgroundColor: colors.secondary }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statIcon}>
                <Ionicons name="heart" size={20} color={colors.primaryForeground} />
              </LinearGradient>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {stats.count}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Items
                </Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statIcon}>
                <Ionicons name="star" size={20} color={colors.primaryForeground} />
              </LinearGradient>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {stats.avgRating.toFixed(1)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Avg Rating
                </Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statIcon}>
                <Ionicons name="cash" size={20} color={colors.primaryForeground} />
              </LinearGradient>
              <View>
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  ${stats.totalPrice.toFixed(0)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                  Total
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderListHeader = () => (
    <View>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Wishlist</Text>
            {wishlist.length > 0 && (
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
              </Text>
            )}
          </View>
        </View>

        {/* Header actions */}
        <View style={styles.headerActions}>
          {/* Grid Toggle Button */}
          {wishlist.length > 0 && (
            <TouchableOpacity
              onPress={toggleGridMode}
              style={[styles.gridToggleButton, { backgroundColor: colors.secondary }]}
              activeOpacity={0.8}
            >
              <Ionicons name={getGridIcon()} size={20} color={colors.foreground} />
            </TouchableOpacity>
          )}

          {/* Clear all button */}
          {wishlist.length > 0 && (
            <TouchableOpacity 
              onPress={clearWishlist} 
              activeOpacity={0.8}
              style={[styles.clearAllButton, { backgroundColor: colors.destructive }]}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderStatsHeader()}
    </View>
  );

  return (
    <ScreenWrapper backgroundColor={colors.background}>
      <TouchableWithoutFeedback 
        onPress={() => {
          if (isSelectionMode && selectedItems.size > 0) {
            handleCancelSelection();
          }
        }}
      >
        <View style={{ flex: 1 }}>
          <FlatList
            data={wishlist}
            key={`${numColumns}-${isSelectionMode ? 'select' : 'normal'}`}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            renderItem={renderWishlistItem}
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={[
              styles.listContent,
              isWeb && styles.webMaxWidth,
            ]}
            columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
            showsVerticalScrollIndicator={false}
          />

          {/* Floating action bar */}
          {isSelectionMode && selectedItems.size > 0 && (
            <View style={[styles.floatingBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.floatingButton, styles.cancelButton]}
                onPress={handleCancelSelection}
                activeOpacity={0.8}
              >
                <Text style={[styles.floatingButtonText, { color: colors.foreground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.floatingButton, styles.deleteButton, { backgroundColor: colors.destructive }]}
                onPress={handleBulkDelete}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={[styles.floatingButtonText, { color: '#fff' }]}>
                  Delete ({selectedItems.size})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  gridToggleButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadow.soft,
  },
  clearAllText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  statsCard: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  statLabel: {
    fontSize: FontSize.xs,
  },

  listContent: {
    paddingBottom: Spacing['3xl'],
  },
  columnWrapper: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.base,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.soft,
  },
  emptyButtonText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },

  webMaxWidth: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },

  // Floating action bar
  floatingBar: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  deleteButton: {
    // backgroundColor set inline
  },
  floatingButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});