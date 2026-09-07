import {FlatList, RefreshControl, View} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useEffect, useState} from 'react';

import ScreenWrapper from '../../../components/ScreenWrapper';
import SearchInput from '../../../components/SearchInput';
import NoDataFound from '../../../components/NoDataFound';
import Header from '../../../components/Header';

import Item from './molecules/Item';

import {get} from '../../../services/ApiRequest';

const Chat = ({navigation}) => {
  const isFocus = useIsFocused();

  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigation = async item => {
    const dataToSend = {
      _id: item?.lot?._id,
      name: item?.lot?.name,
      lastMsg: item?.lastMsg?.conversationId,
    };
    navigation.navigate('InboxScreen', {data: dataToSend});
  };
  const [messagesArray, setMessagesArray] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const getConversationList = async () => {
    setRefreshing(true);
    try {
      const response = await get('auction/conversations');
      setMessagesArray(response.data?.conversations);
    } catch (error) {
      setRefreshing(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getConversationList();
  }, [isFocus]);

  const filteredMessages = messagesArray?.filter(item => {
    const fullName =
      `${item?.otherUser?.fname} ${item?.otherUser?.lname}`?.toLowerCase();
    return fullName?.includes(searchQuery.toLowerCase());
  });

  return (
    <ScreenWrapper
      paddingHorizontal={16}
      headerUnScrollable={() => (
        <>
          {/* <Header title="Chats" /> */}
          <View style={{paddingHorizontal: 16}}>
            <SearchInput
              placeholder="Search By Name"
              marginBottom={20}
              value={searchQuery}
              marginTop={10}
              onChangeText={text => setSearchQuery(text)}
            />
          </View>
        </>
      )}>
      <FlatList
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={getConversationList}
          />
        }
        data={messagesArray}
        // data={filteredMessages}
        ListEmptyComponent={() =>
          !refreshing && (
            <NoDataFound
              title="You have not received any messages"
              desc="All messages will appear here"
            />
          )
        }
        keyExtractor={(_, i) => i.toString()}
        renderItem={({item}) => (
          <Item
            unseen={item?.unseen || 0}
            source={item?.otherUser?.image}
            onPress={() => handleNavigation(item)}
            lastMsg={item?.lastMsg?.message}
            name={item?.lot?.name}
            time={item?.createAt}
          />
        )}
      />
    </ScreenWrapper>
  );
};

export default Chat;
