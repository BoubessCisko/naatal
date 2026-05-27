import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../constants/colors';
import { QUESTIONS } from '../../../constants/questions';
import type { QuestionTarget, GuidedQuestion } from '../../../constants/questions';
import AudioRecorder from '../../../components/AudioRecorder';
import AudioPlayer from '../../../components/AudioPlayer';
import {
  account,
  databases,
  storage,
  realtime,
  DB_ID,
  COLLECTIONS,
  BUCKETS,
  Query,
  Channel,
} from '../../../lib/appwrite';
import { uploadAndSaveAudio, deleteAudioWithFile } from '../../../lib/audioUpload';
import type { ContractDoc, ContractPartyDoc, AudioFileDoc } from '../../../types';
import type { ContractType } from '../../../types';

function needsParty1(t: QuestionTarget) { return t === 'party1' || t === 'both'; }
function needsParty2(t: QuestionTarget) { return t === 'party2' || t === 'both'; }

type AudioMap = Map<number, { party1?: AudioFileDoc; party2?: AudioFileDoc }>;

// Uses the `recorded_by` field (userId) to reliably attribute audio to a party.
function buildAudioMap(
  audios: AudioFileDoc[],
  party1UserId: string,
): AudioMap {
  const m: AudioMap = new Map();
  for (const a of audios) {
    const qi = a.question_index;
    if (!m.has(qi)) m.set(qi, {});
    const entry = m.get(qi)!;
    const recordedBy = (a as any).recorded_by as string | undefined;
    if (recordedBy === party1UserId) {
      if (!entry.party1) entry.party1 = a;
    } else {
      if (!entry.party2) entry.party2 = a;
    }
  }
  return m;
}

function questionComplete(q: GuidedQuestion, rec: { party1?: AudioFileDoc; party2?: AudioFileDoc } | undefined) {
  if (!rec) return false;
  if (needsParty1(q.target) && !rec.party1) return false;
  if (needsParty2(q.target) && !rec.party2) return false;
  return true;
}

function whoseTurn(q: GuidedQuestion, rec: { party1?: AudioFileDoc; party2?: AudioFileDoc } | undefined): 'party1' | 'party2' | null {
  if (needsParty1(q.target) && !rec?.party1) return 'party1';
  if (needsParty2(q.target) && !rec?.party2) return 'party2';
  return null;
}

// Build authenticated download URL for Appwrite Storage files.
// The /view endpoint requires a JWT or active session cookie.
// We append the JWT as a query param which Appwrite accepts.
async function getAuthenticatedFileUrl(fileId: string): Promise<string> {
  const jwt = await account.createJWT();
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
  return `${endpoint}/storage/buckets/${BUCKETS.files}/files/${fileId}/view?project=${projectId}&jwt=${jwt.jwt}`;
}

export default function VoiceRecording() {
  const { id: contractId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ContractDoc | null>(null);
  const [parties, setParties] = useState<ContractPartyDoc[]>([]);
  const [audios, setAudios] = useState<AudioFileDoc[]>([]);
  const [audioUrls, setAudioUrls] = useState<Map<string, string>>(new Map());
  const [myUserId, setMyUserId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [rerecording, setRerecording] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const mountedRef = useRef(true);

  const contractType = (contract?.type ?? 'pret') as ContractType;
  const config = QUESTIONS[contractType];
  const questions = config.questions;

  const party1 = parties.find((p) => p.role === 'initiateur');
  const party2 = parties.find((p) => p.role === 'partie');
  const p1Id = party1?.user_id ?? '';
  const p2Id = party2?.user_id ?? '';
  const party1Label = config.party1Role;
  const party2Label = config.party2Role;

  const myRole = myUserId === p1Id ? 'party1' : myUserId === p2Id ? 'party2' : null;

  const audioMap = buildAudioMap(audios, p1Id);
  const currentRec = audioMap.get(currentQuestionIndex);
  const currentQ = questions[currentQuestionIndex];
  const activeTurn = currentQ ? whoseTurn(currentQ, currentRec) : null;
  const isMyTurn = activeTurn === myRole;
  const currentComplete = currentQ ? questionComplete(currentQ, currentRec) : false;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allDone = currentComplete && isLastQuestion;

  const myAudioThisQuestion = myRole === 'party1' ? currentRec?.party1 : currentRec?.party2;

  // Resolve authenticated URLs for audio files
  useEffect(() => {
    const resolve = async () => {
      const newUrls = new Map(audioUrls);
      let changed = false;
      for (const a of audios) {
        if (!newUrls.has(a.file_id)) {
          try {
            const url = await getAuthenticatedFileUrl(a.file_id);
            newUrls.set(a.file_id, url);
            changed = true;
          } catch {}
        }
      }
      if (changed && mountedRef.current) setAudioUrls(newUrls);
    };
    resolve();
  }, [audios]);

  // Unmount tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    if (!contractId) return;
    try {
      const me = await account.get();
      setMyUserId(me.$id);
      const [doc, partiesRes, audiosRes] = await Promise.all([
        databases.getDocument(DB_ID, COLLECTIONS.contracts, contractId),
        databases.listDocuments(DB_ID, COLLECTIONS.parties, [
          Query.equal('contract_id', contractId), Query.limit(10),
        ]),
        databases.listDocuments(DB_ID, COLLECTIONS.audios, [
          Query.equal('contract_id', contractId),
          Query.orderAsc('question_index'), Query.limit(200),
        ]),
      ]);
      if (!mountedRef.current) return;
      setContract(doc as unknown as ContractDoc);
      setParties(partiesRes.documents as unknown as ContractPartyDoc[]);
      setAudios(audiosRes.documents as unknown as AudioFileDoc[]);
      try {
        const summary = JSON.parse((doc as any).summary || '{}');
        if (typeof summary.currentQuestionIndex === 'number') {
          setCurrentQuestionIndex(summary.currentQuestionIndex);
        }
      } catch {}
    } catch {
      Alert.alert('Erreur', 'Impossible de charger le contrat.');
      router.back();
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [contractId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime: audio_files changes for this contract
  useEffect(() => {
    if (!contractId) return;
    let sub: { unsubscribe: () => Promise<void> } | null = null;
    let cancelled = false;

    const doSubscribe = async () => {
      const s = await realtime.subscribe(
        Channel.database(DB_ID).collection(COLLECTIONS.audios).document(),
        (event) => {
          if (cancelled) return;
          const doc = event.payload as unknown as AudioFileDoc;
          if (doc.contract_id !== contractId) return;
          const isDelete = event.events.some((e: string) => e.includes('delete'));
          setAudios((prev) => {
            if (isDelete) return prev.filter((a) => a.$id !== doc.$id);
            const exists = prev.some((a) => a.$id === doc.$id);
            if (exists) return prev.map((a) => a.$id === doc.$id ? doc : a);
            return [...prev, doc].sort((a, b) => a.question_index - b.question_index);
          });
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
        }
      );
      if (cancelled) { s.unsubscribe(); return; }
      sub = s;
    };
    doSubscribe();

    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, [contractId]);

  // Realtime: contract changes (currentQuestionIndex sync)
  useEffect(() => {
    if (!contractId) return;
    let sub: { unsubscribe: () => Promise<void> } | null = null;
    let cancelled = false;

    const doSubscribe = async () => {
      const s = await realtime.subscribe(
        Channel.database(DB_ID).collection(COLLECTIONS.contracts).document(contractId),
        (event) => {
          if (cancelled) return;
          const doc = event.payload as unknown as ContractDoc;
          setContract(doc);
          try {
            const summary = JSON.parse(doc.summary || '{}');
            if (typeof summary.currentQuestionIndex === 'number') {
              setCurrentQuestionIndex(summary.currentQuestionIndex);
            }
          } catch {}
        }
      );
      if (cancelled) { s.unsubscribe(); return; }
      sub = s;
    };
    doSubscribe();

    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, [contractId]);

  // Upload — uses a ref for isMyTurn to avoid stale closure
  const isMyTurnRef = useRef(isMyTurn);
  isMyTurnRef.current = isMyTurn;
  const currentQIRef = useRef(currentQuestionIndex);
  currentQIRef.current = currentQuestionIndex;

  const handleRecordingComplete = useCallback(async (uri: string, durationMs: number) => {
    if (!contractId || !isMyTurnRef.current) return;
    setUploading(true);
    try {
      await uploadAndSaveAudio({
        uri,
        contractId,
        questionIndex: currentQIRef.current,
        durationMs,
        partyUserIds: [p1Id, p2Id].filter(Boolean),
      });
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Upload échoué.');
    } finally {
      if (mountedRef.current) setUploading(false);
    }
  }, [contractId, p1Id, p2Id]);

  // Re-record: delete Storage file + audio doc
  const handleReRecord = useCallback(async () => {
    if (!myAudioThisQuestion || !myRole) return;
    setRerecording(true);
    try {
      await deleteAudioWithFile(myAudioThisQuestion.$id, myAudioThisQuestion.file_id);
    } catch {
      Alert.alert('Erreur', "Impossible de supprimer l'enregistrement.");
    } finally {
      if (mountedRef.current) setRerecording(false);
    }
  }, [myAudioThisQuestion, myRole]);

  // Advance to next question with error handling
  const handleNextQuestion = useCallback(async () => {
    if (!contractId || !currentComplete) return;
    const nextIndex = currentQuestionIndex + 1;
    try {
      const existingSummary = JSON.parse(contract?.summary || '{}');
      // Only advance if server is still on the same or earlier index (basic guard)
      if (typeof existingSummary.currentQuestionIndex === 'number' &&
          existingSummary.currentQuestionIndex >= nextIndex) {
        setCurrentQuestionIndex(existingSummary.currentQuestionIndex);
        return;
      }
      await databases.updateDocument(DB_ID, COLLECTIONS.contracts, contractId, {
        summary: JSON.stringify({ ...existingSummary, currentQuestionIndex: nextIndex }),
      });
      setCurrentQuestionIndex(nextIndex);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de passer à la question suivante. Réessayez.');
    }
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [contractId, currentQuestionIndex, currentComplete, contract]);

  const handleFinish = () => {
    router.push({ pathname: '/contract/[id]', params: { id: contractId } });
  };

  useEffect(() => {
    if (audios.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [audios.length, currentQuestionIndex]);

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  const getRoleLabel = (target: QuestionTarget) => {
    if (target === 'party1') return party1Label;
    if (target === 'party2') return party2Label;
    return 'Les deux';
  };

  const getFileUrl = (fileId: string) => audioUrls.get(fileId);

  const visibleQuestions = questions.slice(0, currentQuestionIndex + 1);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Enregistrement vocal</Text>
          <Text style={styles.headerSub}>
            {currentQuestionIndex + 1}/{questions.length} · {party1Label} & {party2Label}
          </Text>
        </View>
        {myRole && (
          <View style={[styles.myRoleBadge, {
            backgroundColor: myRole === 'party1' ? 'rgba(0,168,132,0.15)' : 'rgba(245,166,35,0.15)',
          }]}>
            <Text style={[styles.myRoleText, {
              color: myRole === 'party1' ? colors.green : colors.gold,
            }]}>
              {myRole === 'party1' ? party1Label : party2Label}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {visibleQuestions.map((q, i) => {
          const rec = audioMap.get(i);
          const isCurrentQ = i === currentQuestionIndex;

          return (
            <View key={i}>
              <View style={styles.bubbleIn}>
                <Text style={styles.bubbleLabel}>Naatal</Text>
                <Text style={styles.bubbleTarget}>→ {getRoleLabel(q.target)}</Text>
                <Text style={styles.bubbleText}>{q.text}</Text>
              </View>

              {needsParty1(q.target) && rec?.party1 && getFileUrl(rec.party1.file_id) && (
                <View style={styles.bubbleOut}>
                  <View style={styles.audioHeader}>
                    <Text style={styles.turnLabel}>{party1Label}</Text>
                    {isCurrentQ && myRole === 'party1' && (
                      <Pressable onPress={handleReRecord} disabled={rerecording}>
                        <Text style={styles.reRecordLink}>
                          {rerecording ? '…' : 'Re-enregistrer'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <AudioPlayer
                    uri={getFileUrl(rec.party1.file_id)!}
                    durationMs={(rec.party1.duration_seconds ?? 0) * 1000}
                  />
                </View>
              )}

              {needsParty2(q.target) && rec?.party2 && getFileUrl(rec.party2.file_id) && (
                <View style={styles.bubbleOut}>
                  <View style={styles.audioHeader}>
                    <Text style={styles.turnLabel}>{party2Label}</Text>
                    {isCurrentQ && myRole === 'party2' && (
                      <Pressable onPress={handleReRecord} disabled={rerecording}>
                        <Text style={styles.reRecordLink}>
                          {rerecording ? '…' : 'Re-enregistrer'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  <AudioPlayer
                    uri={getFileUrl(rec.party2.file_id)!}
                    durationMs={(rec.party2.duration_seconds ?? 0) * 1000}
                  />
                </View>
              )}

              {!isCurrentQ && questionComplete(q, rec) && (
                <Text style={styles.lockedLabel}>🔒 Verrouillé</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {uploading ? (
          <View style={styles.waitingBar}>
            <ActivityIndicator size="small" color={colors.green} />
            <Text style={styles.waitingText}>Upload en cours…</Text>
          </View>
        ) : allDone ? (
          <Pressable
            onPress={handleFinish}
            style={({ pressed }) => [
              styles.finishButton,
              { backgroundColor: pressed ? colors.greenDark : colors.green },
            ]}
          >
            <Text style={styles.finishText}>Voir le résumé du contrat</Text>
          </Pressable>
        ) : currentComplete ? (
          <Pressable
            onPress={isLastQuestion ? handleFinish : handleNextQuestion}
            style={({ pressed }) => [
              styles.finishButton,
              { backgroundColor: pressed ? colors.greenDark : colors.green },
            ]}
          >
            <Text style={styles.finishText}>
              {isLastQuestion ? 'Terminer' : 'Question suivante →'}
            </Text>
          </Pressable>
        ) : isMyTurn && !myAudioThisQuestion ? (
          <>
            <View style={styles.turnIndicator}>
              <View style={[styles.turnDot, {
                backgroundColor: myRole === 'party1' ? colors.green : colors.gold
              }]} />
              <Text style={styles.turnText}>
                C'est votre tour ({myRole === 'party1' ? party1Label : party2Label})
              </Text>
            </View>
            <AudioRecorder
              key={`${currentQuestionIndex}-${myRole}`}
              onRecordingComplete={handleRecordingComplete}
            />
          </>
        ) : (
          <View style={styles.waitingBar}>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text style={styles.waitingText}>
              En attente du {activeTurn === 'party1' ? party1Label : party2Label}…
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, gap: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 18 },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  headerSub: { color: colors.muted, fontSize: 12 },
  myRoleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  myRoleText: { fontSize: 11, fontWeight: '700' },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, gap: 12 },
  bubbleIn: {
    backgroundColor: colors.surface, borderRadius: 16, borderTopLeftRadius: 0,
    padding: 12, paddingHorizontal: 16, maxWidth: '85%',
    alignSelf: 'flex-start', marginBottom: 8,
  },
  bubbleLabel: { color: colors.green, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  bubbleTarget: { color: colors.gold, fontSize: 11, fontWeight: '600', marginBottom: 6 },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  bubbleOut: { maxWidth: '85%', alignSelf: 'flex-end', marginBottom: 8, gap: 4 },
  audioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  turnLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  reRecordLink: { color: colors.red, fontSize: 11, fontWeight: '600' },
  lockedLabel: { color: colors.muted, fontSize: 10, textAlign: 'center', marginBottom: 8 },
  bottomBar: {
    backgroundColor: colors.surface, paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  turnIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 4,
  },
  turnDot: { width: 8, height: 8, borderRadius: 4 },
  turnText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  waitingBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20,
  },
  waitingText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  finishButton: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 4 },
  finishText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
