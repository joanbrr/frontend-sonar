import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ResultsCard from '@/app/components/ResultsCard';
import { Result } from '@/app/lib/types';
import { getResults } from '@/app/lib/api';
import * as ImageColors from 'react-native-image-colors'; // For extracting colors from images

// Moved card styling to a separate object for better maintainability
const cardStyles = {
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
  shadowOpacity: 0.2,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
};

// Tag component extracted for reusability
const TagPill = ({ tag, color }: { tag: string; color: string }) => (
  <View style={[styles.tagPill, { backgroundColor: color }]}>
    <Text style={styles.tagText}>{tag}</Text>
  </View>
);

export default function ViewResults() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<Result[]>([]);
  const [cardColors, setCardColors] = useState<{[key: number]: string}>({});

  useEffect(() => {
    const fetchResults = async () => {
      const data = await getResults();
      setResults(data);
      
      // Extract dominant colors from artist photos
      const colorsMap: {[key: number]: string} = {};
      await Promise.all(data.map(async (result) => {
        if (result.image_uri) {
          try {
            const colors = await ImageColors.getColors(result.image_uri);
            colorsMap[result.id] = (
              colors.dominant ||       // Android
              colors.background ||     // iOS
              colors.primary ||        // Web
              colors.average ||        // Some platforms
              colors.vibrant ||        // Some platforms
              '#6b7280'               // Fallback
            );
          } catch (error) {
            colorsMap[result.id] = '#6b7280'; // Fallback if color extraction fails
          }
        }
      }));
      
      setCardColors(colorsMap);
      setLoading(false);
    };

    fetchResults();
  }, []);

  // Function to render tags with overflow handling
  const renderTags = (tags: string[], color: string) => {
    const [showAll, setShowAll] = useState(false);
    const [visibleTags, setVisibleTags] = useState<string[]>([]);
    const [remainingCount, setRemainingCount] = useState(0);

    useEffect(() => {
      // This effect will calculate how many tags can fit in one line
      // Note: This is a simplified approach - you might need a more precise measurement
      const maxTagsPerLine = 4; // Adjust based on your design
      setVisibleTags(showAll ? tags : tags.slice(0, maxTagsPerLine));
      setRemainingCount(showAll ? 0 : Math.max(0, tags.length - maxTagsPerLine));
    }, [tags, showAll]);

    return (
      <View style={styles.tagsContainer}>
        {visibleTags.map((tag, index) => (
          <TagPill key={index} tag={tag} color={color} />
        ))}
        {remainingCount > 0 && (
          <TouchableOpacity onPress={() => setShowAll(true)}>
            <View style={[styles.tagPill, { backgroundColor: color }]}>
              <Text style={styles.tagText}>+{remainingCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      ) : (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {results.map((result) => (
              <ResultsCard
                key={result.id}
                title={result.title}
                description={result.description}
                schedule={result.schedules.title}
                startTime={result.start_time}
                endTime={result.end_time}
                imageUri={result.image_uri}
                bgColor={cardColors[result.id] || '#6b7280'} // Fallback color
                tags={result.tags} // Assuming tags are part of the result
                renderTags={renderTags}
                cardStyles={cardStyles}
              />
            ))}
            <View style={{ height: 110 }} />
          </ScrollView>

          {/* Footer with gradient */}
          <View style={styles.footer}>
            <LinearGradient
              colors={[
                'rgba(0,0,0,0)',
                'rgba(0,0,0,0.7)',
                'rgba(0,0,0,0.97)',
                'rgba(0,0,0,1)'
              ]}
              locations={[0, 0.2, 0.4, 0.8]}
              style={styles.gradient}
            />
            
            <View style={styles.footerContent}>
              <Link href="/" asChild>
                <TouchableOpacity style={styles.startAgainButton}>
                  <Text style={styles.buttonText}>Start Again</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Styles moved to StyleSheet for better performance and organization
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000', // Assuming dark theme
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    width: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  gradient: {
    position: 'absolute',
    height: 160,
    width: '100%',
    bottom: 0,
  },
  footerContent: {
    alignItems: 'center',
    paddingBottom: 80,
    paddingTop: 16,
  },
  startAgainButton: {
    backgroundColor: '#f59e0b', // yellow-400
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});