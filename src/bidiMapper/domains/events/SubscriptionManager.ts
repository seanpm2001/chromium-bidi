/**
 * Copyright 2022 Google LLC.
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  BrowsingContext,
  CDP,
  CommonDataTypes,
  Log,
  Session,
} from '../../../protocol/protocol.js';
import {BrowsingContextStorage} from '../context/browsingContextStorage.js';

export class SubscriptionManager {
  #subscriptionPriority = 0;
  // BrowsingContext `null` means the event has subscription across all the
  // browsing contexts.
  // Channel `null` means no `channel` should be added.
  #channelToContextToEventMap: Map<
    string | null,
    Map<
      CommonDataTypes.BrowsingContext | null,
      Map<Session.SubscribeParametersEvent, number>
    >
  > = new Map();
  #browsingContextStorage: BrowsingContextStorage;

  constructor(browsingContextStorage: BrowsingContextStorage) {
    this.#browsingContextStorage = browsingContextStorage;
  }

  getChannelsSubscribedToEvent(
    eventMethod: Session.SubscribeParametersEvent,
    contextId: CommonDataTypes.BrowsingContext | null
  ): (string | null)[] {
    const prioritiesAndChannels = Array.from(
      this.#channelToContextToEventMap.keys()
    )
      .map((channel) => ({
        priority: this.#getEventSubscriptionPriorityForChannel(
          eventMethod,
          contextId,
          channel
        ),
        channel,
      }))
      .filter(({priority}) => priority !== null) as {
      priority: number;
      channel: string | null;
    }[];

    // Sort channels by priority.
    return prioritiesAndChannels
      .sort((a, b) => a.priority - b.priority)
      .map(({channel}) => channel);
  }

  #getEventSubscriptionPriorityForChannel(
    eventMethod: Session.SubscribeParametersEvent,
    contextId: CommonDataTypes.BrowsingContext | null,
    channel: string | null
  ): null | number {
    const contextToEventMap = this.#channelToContextToEventMap.get(channel);
    if (contextToEventMap === undefined) {
      return null;
    }

    // Get all the subscription priorities.
    const priorities: number[] = this.#getRelevantContexts(contextId)
      .map((c) => contextToEventMap.get(c)?.get(eventMethod))
      .filter((p) => p !== undefined) as number[];

    if (priorities.length === 0) {
      // Not subscribed, return null.
      return null;
    }

    // Return minimal priority.
    return Math.min(...priorities);
  }

  #getRelevantContexts(
    contextId: CommonDataTypes.BrowsingContext | null
  ): (CommonDataTypes.BrowsingContext | null)[] {
    // `null` covers global subscription.
    const result: (CommonDataTypes.BrowsingContext | null)[] = [null];
    while (contextId !== null) {
      result.push(contextId);
      const maybeParentContext =
        this.#browsingContextStorage.findContext(contextId);
      contextId = maybeParentContext?.parentId ?? null;
    }
    return result;
  }

  subscribe(
    event: Session.SubscribeParametersEvent,
    contextId: CommonDataTypes.BrowsingContext | null,
    channel: string | null
  ): void {
    if (event === BrowsingContext.AllEvents) {
      Object.values(BrowsingContext.EventNames).map((specificEvent) =>
        this.subscribe(specificEvent, contextId, channel)
      );
      return;
    }
    if (event === CDP.AllEvents) {
      Object.values(CDP.EventNames).map((specificEvent) =>
        this.subscribe(specificEvent, contextId, channel)
      );
      return;
    }
    if (event === Log.AllEvents) {
      Object.values(Log.EventNames).map((specificEvent) =>
        this.subscribe(specificEvent, contextId, channel)
      );
      return;
    }

    if (!this.#channelToContextToEventMap.has(channel)) {
      this.#channelToContextToEventMap.set(channel, new Map());
    }
    const contextToEventMap = this.#channelToContextToEventMap.get(channel)!;

    if (!contextToEventMap.has(contextId)) {
      contextToEventMap.set(contextId, new Map());
    }
    const eventMap = contextToEventMap.get(contextId)!;

    // Do not re-subscribe to events to keep the priority.
    if (eventMap.has(event)) {
      return;
    }

    eventMap.set(event, this.#subscriptionPriority++);
  }

  unsubscribe(
    event: Session.SubscribeParametersEvent,
    contextId: CommonDataTypes.BrowsingContext | null,
    channel: string | null
  ): void {
    if (event === BrowsingContext.AllEvents) {
      Object.values(BrowsingContext.EventNames).map((specificEvent) =>
        this.unsubscribe(specificEvent, contextId, channel)
      );
      return;
    }
    if (event === CDP.AllEvents) {
      Object.values(CDP.EventNames).map((specificEvent) =>
        this.unsubscribe(specificEvent, contextId, channel)
      );
      return;
    }
    if (event === Log.AllEvents) {
      Object.values(Log.EventNames).map((specificEvent) =>
        this.unsubscribe(specificEvent, contextId, channel)
      );
      return;
    }

    if (!this.#channelToContextToEventMap.has(channel)) {
      return;
    }
    const contextToEventMap = this.#channelToContextToEventMap.get(channel)!;

    if (!contextToEventMap.has(contextId)) {
      return;
    }
    const eventMap = contextToEventMap.get(contextId)!;

    eventMap.delete(event);

    // Clean up maps if empty.
    if (eventMap.size === 0) {
      contextToEventMap.delete(event);
    }
    if (contextToEventMap.size === 0) {
      this.#channelToContextToEventMap.delete(channel);
    }
  }
}
