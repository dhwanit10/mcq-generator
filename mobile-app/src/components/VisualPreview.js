import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

/**
 * Visual Preview Component for Mobile
 * Handles:
 * 1. Chemical Structures via 2D PubChem & NIH CACTUS molecular rendering
 * 2. Function curves & coordinate graphs
 * 3. Biological diagrams & keyword highlights
 */
export default function VisualPreview({ hasVisual, visualType, visualData, qText = '' }) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [useCactusFallback, setUseCactusFallback] = useState(false);
  const [showRawSmiles, setShowRawSmiles] = useState(false);

  if (!hasVisual && !visualType && !visualData) {
    if (qText && qText.includes('"data"') && qText.includes('"layout"')) {
      return null;
    }
    return null;
  }

  // ── 1. Chemical Structure (SMILES) ──
  if (visualType === 'structure' || visualData?.smiles) {
    const rawSmiles = visualData?.smiles || 'c1ccccc1';
    const smiles = rawSmiles.trim();

    // Primary: PubChem PUG REST API for 2D molecular structure
    const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/PNG?record_type=2d&image_size=large`;
    // Fallback: NIH CACTUS chemical resolver
    const cactusUrl = `https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(smiles)}/image`;

    const activeImageUrl = useCactusFallback ? cactusUrl : pubchemUrl;

    const handleImageError = () => {
      if (!useCactusFallback) {
        setUseCactusFallback(true);
        setImageLoading(true);
      } else {
        setImageError(true);
        setImageLoading(false);
      }
    };

    return (
      <View style={styles.visualCard}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.typeBadge}>
            <Ionicons name="flask" size={13} color={colors.primaryDark} />
            <Text style={styles.typeBadgeText}>Chemical Molecular Structure</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowRawSmiles(!showRawSmiles)}
            style={styles.toggleSmilesBtn}
          >
            <Text style={styles.toggleSmilesText}>
              {showRawSmiles ? 'Hide Formula' : 'SMILES'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2D Molecular Structure Image Canvas */}
        <View style={styles.imageCanvas}>
          {!imageError ? (
            <>
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Rendering Molecular 2D Graph...</Text>
                </View>
              )}
              <Image
                source={{ uri: activeImageUrl }}
                style={styles.moleculeImage}
                resizeMode="contain"
                onLoadEnd={() => setImageLoading(false)}
                onError={handleImageError}
              />
            </>
          ) : (
            <View style={styles.fallbackBox}>
              <Ionicons name="flask-outline" size={32} color={colors.primary} />
              <Text style={styles.fallbackTitle}>Molecular Structure</Text>
              <Text style={styles.smilesCodePill}>{smiles}</Text>
            </View>
          )}
        </View>

        {/* SMILES code toggle view */}
        {showRawSmiles && (
          <View style={styles.smilesDetailsBox}>
            <Text style={styles.smilesLabel}>Canonical SMILES Notation:</Text>
            <Text style={styles.smilesValue}>{smiles}</Text>
          </View>
        )}
      </View>
    );
  }

  // ── 2. Graph / Plotly spec ──
  if (visualType === 'graph' || visualData?.plotly_spec) {
    const spec = visualData?.plotly_spec || {};
    const title = spec.layout?.title?.text || spec.layout?.title || 'Data Graph';
    const series = spec.data && spec.data.length > 0 ? spec.data[0] : null;

    return (
      <View style={styles.visualCard}>
        <View style={styles.headerRow}>
          <View style={styles.typeBadge}>
            <Ionicons name="analytics" size={13} color={colors.primaryDark} />
            <Text style={styles.typeBadgeText}>Function / Graph</Text>
          </View>
        </View>

        <Text style={styles.graphTitle}>{title}</Text>

        {series && (
          <View style={styles.graphContentBox}>
            <View style={styles.axisHeader}>
              <Text style={styles.axisText}>
                X: {spec.layout?.xaxis?.title || 'x'} • Y: {spec.layout?.yaxis?.title || 'y'}
              </Text>
              {series.name && <Text style={styles.seriesName}>{series.name}</Text>}
            </View>

            {series.x && series.y && (
              <View style={styles.pointsGrid}>
                {series.x.slice(0, 6).map((xVal, idx) => (
                  <View key={idx} style={styles.coordinateBadge}>
                    <Text style={styles.coordinateText}>
                      ({xVal}, {series.y[idx]})
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  // ── 3. Biological Diagram ──
  if (visualType === 'diagram' || visualData?.diagram_name) {
    const name = visualData?.diagram_name || 'Biological Diagram';
    const keywords = visualData?.diagram_keywords || [];

    return (
      <View style={styles.visualCard}>
        <View style={styles.headerRow}>
          <View style={styles.typeBadge}>
            <Ionicons name="leaf" size={13} color={colors.primaryDark} />
            <Text style={styles.typeBadgeText}>Biological Diagram Reference</Text>
          </View>
        </View>

        <Text style={styles.graphTitle}>{name}</Text>

        {keywords.length > 0 && (
          <View style={styles.keywordsWrap}>
            {keywords.map((kw, i) => (
              <View key={i} style={styles.keywordBadge}>
                <Text style={styles.keywordBadgeText}>{kw}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  visualCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  toggleSmilesBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleSmilesText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  imageCanvas: {
    height: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  moleculeImage: {
    width: '92%',
    height: '92%',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadingText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  fallbackBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  fallbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginTop: 6,
    marginBottom: 6,
  },
  smilesCodePill: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.primaryDark,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  smilesDetailsBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smilesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  smilesValue: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.text,
  },
  graphTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  graphContentBox: {
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  axisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  axisText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  seriesName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  pointsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  coordinateBadge: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  coordinateText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  keywordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keywordBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  keywordBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
