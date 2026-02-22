"use client";

import { useState, useEffect } from "react";
import { Part3Question, Part3Turn, Part3Speaker } from "@/lib/types";
import { X } from "lucide-react";

interface Part3EditModalProps {
  part3Question: Part3Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedQuestion: Part3Question) => void;
}

export default function Part3EditModal({ part3Question, isOpen, onClose, onSave }: Part3EditModalProps) {
  const [formData, setFormData] = useState<Part3Question | null>(null);

  useEffect(() => {
    if (part3Question) {
      setFormData({ ...part3Question });
    }
  }, [part3Question]);

  if (!isOpen || !formData) return null;

  const handleSpeakerChange = (index: number, field: keyof Part3Speaker, value: string) => {
    if (!formData) return;
    
    const updatedSpeakers = [...formData.speakers];
    updatedSpeakers[index] = {
      ...updatedSpeakers[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      speakers: updatedSpeakers
    });
  };

  const handleConversationChange = (index: number, field: keyof Part3Turn, value: string) => {
    if (!formData) return;
    
    const updatedConversation = [...formData.conversation];
    updatedConversation[index] = {
      ...updatedConversation[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      conversation: updatedConversation
    });
  };

  const handleQuestionChange = (qIndex: number, field: string, value: string | string[]) => {
    if (!formData) return;
    
    const updatedQuestions = [...formData.questions];
    updatedQuestions[qIndex] = {
      ...updatedQuestions[qIndex],
      [field]: value
    };
    
    setFormData({
      ...formData,
      questions: updatedQuestions
    });
  };

  const addConversationTurn = () => {
    if (!formData) return;
    
    const newTurn: Part3Turn = {
      speaker: "A",
      text: "",
      translation: ""
    };
    
    setFormData({
      ...formData,
      conversation: [...formData.conversation, newTurn]
    });
  };

  const removeConversationTurn = (index: number) => {
    if (!formData || formData.conversation.length <= 1) return;
    
    const updatedConversation = formData.conversation.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      conversation: updatedConversation
    });
  };

  const handleSave = () => {
    if (formData) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-6xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Part 3問題編集</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ID</label>
                <input
                  type="text"
                  value={formData.id}
                  disabled
                  className="w-full p-2 border rounded bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">難易度</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard'})}
                  className="w-full p-2 border rounded"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">シナリオ</label>
                <input
                  type="text"
                  value={formData.scenario}
                  onChange={(e) => setFormData({...formData, scenario: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">シナリオ翻訳</label>
                <input
                  type="text"
                  value={formData.scenarioTranslation}
                  onChange={(e) => setFormData({...formData, scenarioTranslation: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">業種</label>
                <input
                  type="text"
                  value={formData.industry || ""}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">トピック</label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            {/* 話者情報 */}
            <div>
              <h3 className="text-lg font-medium mb-3">話者情報</h3>
              <div className="space-y-3">
                {formData.speakers.map((speaker, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded">
                    <div>
                      <label className="block text-sm font-medium mb-1">話者ID</label>
                      <input
                        type="text"
                        value={speaker.id}
                        onChange={(e) => handleSpeakerChange(index, 'id', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">名前</label>
                      <input
                        type="text"
                        value={speaker.name}
                        onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">役割</label>
                      <input
                        type="text"
                        value={speaker.role}
                        onChange={(e) => handleSpeakerChange(index, 'role', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">性別</label>
                      <select
                        value={speaker.gender || ""}
                        onChange={(e) => handleSpeakerChange(index, 'gender', e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">未設定</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 会話内容 */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">会話内容</h3>
                <button
                  onClick={addConversationTurn}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  ターン追加
                </button>
              </div>
              <div className="space-y-3">
                {formData.conversation.map((turn, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded">
                    <div>
                      <label className="block text-sm font-medium mb-1">話者</label>
                      <select
                        value={turn.speaker}
                        onChange={(e) => handleConversationChange(index, 'speaker', e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        {formData.speakers.map(speaker => (
                          <option key={speaker.id} value={speaker.id}>{speaker.id} - {speaker.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">発話内容（英語）</label>
                      <textarea
                        value={turn.text}
                        onChange={(e) => handleConversationChange(index, 'text', e.target.value)}
                        className="w-full p-2 border rounded h-20"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1">翻訳（日本語）</label>
                      <textarea
                        value={turn.translation}
                        onChange={(e) => handleConversationChange(index, 'translation', e.target.value)}
                        className="w-full p-2 border rounded h-20"
                      />
                      {formData.conversation.length > 1 && (
                        <button
                          onClick={() => removeConversationTurn(index)}
                          className="absolute top-0 right-0 p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 質問セット */}
            <div>
              <h3 className="text-lg font-medium mb-3">質問セット</h3>
              <div className="space-y-4">
                {formData.questions.map((question, qIndex) => (
                  <div key={qIndex} className="p-4 border rounded bg-gray-50">
                    <h4 className="font-medium mb-3">質問 {qIndex + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">問題文（英語）</label>
                        <textarea
                          value={question.question}
                          onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                          className="w-full p-2 border rounded h-20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">問題文翻訳</label>
                        <textarea
                          value={question.questionTranslation}
                          onChange={(e) => handleQuestionChange(qIndex, 'questionTranslation', e.target.value)}
                          className="w-full p-2 border rounded h-20"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">選択肢（英語）</label>
                        {question.options.map((option, oIndex) => (
                          <input
                            key={oIndex}
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options];
                              newOptions[oIndex] = e.target.value;
                              handleQuestionChange(qIndex, 'options', newOptions);
                            }}
                            className="w-full p-2 border rounded mb-1"
                            placeholder={`選択肢 ${String.fromCharCode(65 + oIndex)}`}
                          />
                        ))}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">選択肢翻訳</label>
                        {question.optionTranslations.map((translation, oIndex) => (
                          <input
                            key={oIndex}
                            type="text"
                            value={translation}
                            onChange={(e) => {
                              const newTranslations = [...question.optionTranslations];
                              newTranslations[oIndex] = e.target.value;
                              handleQuestionChange(qIndex, 'optionTranslations', newTranslations);
                            }}
                            className="w-full p-2 border rounded mb-1"
                            placeholder={`翻訳 ${String.fromCharCode(65 + oIndex)}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">正解</label>
                        <input
                          type="text"
                          value={question.correct}
                          onChange={(e) => handleQuestionChange(qIndex, 'correct', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">問題タイプ</label>
                        <select
                          value={question.questionType}
                          onChange={(e) => handleQuestionChange(qIndex, 'questionType', e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="detail">Detail</option>
                          <option value="main_idea">Main Idea</option>
                          <option value="inference">Inference</option>
                          <option value="speaker_intention">Speaker Intention</option>
                          <option value="next_action">Next Action</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">解説</label>
                        <textarea
                          value={question.explanation}
                          onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                          className="w-full p-2 border rounded h-20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}