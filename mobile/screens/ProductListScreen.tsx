// React Native ProductListScreen
// Main screen showing all products

import React, { useEffect, useMemo, useState } from "react";
import { getProducts, ApiProduct } from "../services/api";

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ProductCard } from "../components/ProductCard";
import { CategoryFilter } from "../components/CategoryFilter";
import { SearchBar } from "../components/SearchBar";
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from "../constants/theme";

export const ProductListScreen: React.FC = () => {
  const colors = Colors.light;

  // ✅ API datası
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI filter states
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ API fetch
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const page = await getProducts({ page: 0, size: 50, sort: "name,asc" });
        if (mounted) setApiProducts(page.content);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "API error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Artık filtre kaynağı: apiProducts
  const filteredProducts = useMemo(() => {
    let filtered = apiProducts;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [apiProducts, selectedCategory, searchQuery]);

  // ✅ TS hatasını fix + 0 bölme fix
  const stats = useMemo(() => {
    const totalReviews = apiProducts.reduce((acc, p) => acc + (p.reviewCount ?? 0), 0);

    const sumRating = apiProducts.reduce((acc, p) => acc + (p.averageRating ?? 0), 0);
    const avgRating = apiProducts.length > 0 ? sumRating / apiProducts.length : 0;

    return { totalReviews, avgRating, productCount: apiProducts.length };
  }, [apiProducts]);

  const renderHeader = () => (
    <View>
      <View style={[styles.heroSection, { backgroundColor: colors.accent }]}>
        <View style={[styles.tagline, { backgroundColor: colors.background }]}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
          <Text style={[styles.taglineText, { color: colors.accentForeground }]}>
            Discover honest reviews from real users
          </Text>
        </View>

        <Text style={[styles.heroTitle, { color: colors.foreground }]}>
          Find Products You'll <Text style={{ color: colors.primary }}>Love</Text>
        </Text>

        <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
          Read authentic reviews, compare ratings, and make informed decisions.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <LinearGradient colors={["#F59E0B", "#FBBF24"]} style={styles.statIcon}>
              <Ionicons name="star" size={18} color={colors.primaryForeground} />
            </LinearGradient>
            <View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {stats.avgRating.toFixed(1)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Avg Rating</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <LinearGradient colors={["#F59E0B", "#FBBF24"]} style={styles.statIcon}>
              <Ionicons name="trending-up" size={18} color={colors.primaryForeground} />
            </LinearGradient>
            <View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {stats.totalReviews.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Reviews</Text>
            </View>
          </View>

          <View style={styles.statItem}>
            <LinearGradient colors={["#F59E0B", "#FBBF24"]} style={styles.statIcon}>
              <Ionicons name="cube" size={18} color={colors.primaryForeground} />
            </LinearGradient>
            <View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.productCount}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Products</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.searchSection}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Explore Products</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            {filteredProducts.length} products found
          </Text>
        </View>
      </View>

      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

      {/* ✅ Loading/Error UI */}
      {loading && (
        <View style={{ paddingVertical: 16 }}>
          <ActivityIndicator />
        </View>
      )}
      {error && (
        <View style={{ paddingVertical: 12, paddingHorizontal: Spacing.lg }}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search" size={48} color={colors.mutedForeground} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No products found</Text>
      <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
        Try adjusting your search or filters
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => String(item.id)} // ✅ id number olabilir
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => <ProductCard product={item as any} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing["3xl"],
    alignItems: "center",
  },
  tagline: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  taglineText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  heroTitle: {
    fontSize: FontSize["3xl"],
    fontWeight: FontWeight.bold,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  heroSubtitle: {
    fontSize: FontSize.base,
    textAlign: "center",
    lineHeight: FontSize.base * 1.5,
    marginBottom: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
  },
  statsRow: { flexDirection: "row", justifyContent: "center", gap: Spacing["2xl"] },
  statItem: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.soft,
  },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs },
  searchSection: { paddingVertical: Spacing.lg },
  sectionHeader: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize["2xl"], fontWeight: FontWeight.bold, marginBottom: Spacing.xs },
  sectionSubtitle: { fontSize: FontSize.sm },
  listContent: { paddingBottom: Spacing["3xl"] },
  columnWrapper: {
    paddingHorizontal: Spacing.lg,
    justifyContent: "space-between",
    marginTop: Spacing.lg,
  },
  emptyContainer: { alignItems: "center", paddingVertical: Spacing["5xl"], gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.medium },
  emptySubtitle: { fontSize: FontSize.base },
});
